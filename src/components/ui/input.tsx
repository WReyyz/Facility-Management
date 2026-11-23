import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--text)] focus-visible:ring-1 focus-visible:ring-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--danger)] focus-visible:border-[var(--danger)] focus-visible:ring-[var(--danger)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--danger)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
