import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "danger" | "success" | "info" | "warning" | "neutral";
  size?: "sm" | "default";
}

export function Badge({
  className,
  variant = "neutral",
  size = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    danger: "bg-[var(--danger-bg)] text-[var(--danger)] border-transparent",
    success: "bg-[var(--success-bg)] text-[var(--success)] border-transparent",
    info: "bg-[var(--info-bg)] text-[var(--info)] border-transparent",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)] border-transparent",
    neutral: "bg-[var(--neutral-bg)] text-[var(--neutral)] border-transparent",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[11px] rounded-[var(--r-sm)]",
    default: "px-2 py-0.5 text-xs rounded-[var(--r-sm)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium select-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
