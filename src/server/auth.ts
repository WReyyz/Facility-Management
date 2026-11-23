import * as crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "facility-management-super-secret-key-32-chars-min"
);

export const SESSION_COOKIE_NAME = "facility_session";
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds (PRD FR-AUTH-04)

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
}

// 1. Password Hashing & Verification
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [algo, salt, hash] = storedHash.split(":");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
    const hashBuffer = Buffer.from(hash, "hex");
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch {
    return false;
  }
}

// 2. JWT Session Helpers
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as Role,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

// 3. Current Session Getter (Server-side)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// 4. Rate Limiting Check (PRD FR-AUTH-03: 5 failed attempts locks for 15 min)
export async function handleFailedLogin(userId: string, currentAttempts: number) {
  const newAttempts = currentAttempts + 1;
  const lockTime =
    newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: newAttempts,
      lockedUntil: lockTime,
    },
  });

  return newAttempts >= 5;
}

export async function resetFailedLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
  });
}
