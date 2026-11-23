import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "link" | "icon" | "danger" | "dashed";
  size?: "sm" | "default" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 select-none cursor-pointer";

    const variants = {
      primary:
        "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99]",
      secondary:
        "bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] active:scale-[0.99]",
      ghost:
        "text-[var(--text)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]",
      link: "text-[var(--link)] underline-offset-4 hover:underline p-0 h-auto",
      icon: "bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] rounded-[var(--r-md)]",
      danger:
        "bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-[#FCDCDC] active:scale-[0.99]",
      dashed:
        "bg-transparent text-[var(--text-muted)] border border-dashed border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-subtle)]",
    };

    const sizes = {
      sm: "h-8 px-2.5 text-xs rounded-[var(--r-sm)] gap-1.5",
      default: "h-9 px-3.5 text-sm rounded-[var(--r-md)] gap-2",
      lg: "h-11 px-5 text-sm rounded-[var(--r-md)] gap-2",
      icon: "h-9 w-9 p-0 rounded-[var(--r-md)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
