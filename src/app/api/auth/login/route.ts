import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  handleFailedLogin,
  resetFailedLogin,
} from "@/server/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // 1. Look up user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      // Generic error (PRD FR-AUTH-02)
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 }
      );
    }

    // 2. Check if account is locked (PRD FR-AUTH-03)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return NextResponse.json(
        {
          error: `Account is temporarily locked. Try again in ${remainingMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    // 3. Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const isLockedNow = await handleFailedLogin(user.id, user.failedAttempts);
      if (isLockedNow) {
        return NextResponse.json(
          {
            error: "Too many failed attempts. Account locked for 15 minutes.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 }
      );
    }

    // 4. Successful login -> reset failed attempts
    await resetFailedLogin(user.id);

    // 5. Generate session token & set HttpOnly cookie
    const sessionUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
