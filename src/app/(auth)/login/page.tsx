"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  PenTool,
  ShoppingBag,
  Flag,
  Home,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const steps = [
    { num: 1, title: "Request", desc: "Incoming letter", icon: FileText, done: true },
    { num: 2, title: "Engineering", desc: "Design, BOQ, drawings", icon: PenTool, done: true },
    { num: 3, title: "Procurement", desc: "Vendors & Purchased", icon: ShoppingBag, done: true },
    { num: 4, title: "Execution", desc: "Progress & staged payments", icon: Flag, done: false },
    { num: 5, title: "Handover", desc: "Warranty & retention", icon: Home, done: false },
  ];

  const chips = [
    "Live progress",
    "Vendor scorecards",
    "Staged payments",
    "Warranty tracking",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect username or password.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg)] font-sans">
      {/* LEFT SECTION (50% on Desktop with Background Factory Asset) */}
      <div className="hidden lg:flex lg:w-1/2 relative p-10 xl:p-14 flex-col justify-between overflow-hidden select-none">
        {/* Background Image: High-res Facility Workshop Asset */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
          style={{
            backgroundImage: "url('/images/facility-hero.jpg')",
          }}
        />

        {/* Industrial Duotone / Cool Blue Tint Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C223E]/85 via-[#122F55]/75 to-[#0A1A2F]/88 backdrop-blur-[1px]" />

        {/* Subtle radial light accent over the engine crane */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,rgba(180,30,80,0.18),transparent_55%)] pointer-events-none" />

        {/* 1. Header / Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
          <span className="font-bold text-lg tracking-tight text-white drop-shadow-sm">
            Facility Project Management
          </span>
        </div>

        {/* 2. 5-Step Journey Stepper */}
        <div className="relative z-10 py-6 my-auto space-y-7 max-w-lg">
          <div>
            <span className="text-[11px] font-bold text-cyan-200 tracking-widest uppercase drop-shadow-xs">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white mt-1.5 tracking-tight leading-snug drop-shadow-sm">
              From request letter to final handover
            </h2>
          </div>

          <div className="relative space-y-2 pt-1">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-start gap-4">
                  {/* Left Column: Circle & Perfectly Centered Vertical Connecting Line */}
                  <div className="flex flex-col items-center shrink-0 w-9">
                    {/* Step Circle */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-all",
                        s.done
                          ? "bg-[#95D3BD] text-[#0A3828] shadow-[0_0_12px_rgba(149,211,189,0.35)]"
                          : "bg-white text-slate-800 shadow-sm"
                      )}
                    >
                      {s.done ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                    </div>

                    {/* Centered Connecting Line */}
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-[2px] h-6 my-1 rounded-full transition-colors",
                          s.done ? "bg-[#34D399]" : "bg-white/30"
                        )}
                      />
                    )}
                  </div>

                  {/* Right Column: Step Label & Description */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-tight">
                        {s.title}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-white/80" />
                    </div>
                    <span className="text-xs text-blue-100/90 font-medium block mt-0.5">
                      {s.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Feature Chips */}
        <div className="relative z-10 pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-2.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="px-3.5 py-1 rounded-full text-xs font-medium text-white border border-white/30 bg-white/10 backdrop-blur-md shadow-xs hover:bg-white/20 transition-colors"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION (50% on Desktop, Full on Mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white overflow-hidden">
        {/* Subtle geometric light blue background accent */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-100/40 via-blue-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-6 relative z-10">
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111113]" />
            <span className="font-bold text-lg tracking-tight text-[#0F1E36]">
              Facility Project Management
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-[var(--danger-bg)] border border-[#F8B4B4] text-[var(--danger)] text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full h-11 px-3.5 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show
                    </>
                  )}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full h-11 px-3.5 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all shadow-xs"
              />
            </div>

            {/* Black button that turns white on hover */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-11 text-sm font-semibold rounded-lg mt-3 bg-[#111113] text-white border border-[#111113] hover:bg-white hover:text-[#111113] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Need access? Ask your administrator to create an account for you.
          </p>
        </div>
      </div>
    </div>
  );
}
