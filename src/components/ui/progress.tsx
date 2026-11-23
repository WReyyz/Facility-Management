import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  isOverdue?: boolean;
}

export function Progress({
  className,
  value = 0,
  max = 100,
  isOverdue = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-400 ease-out rounded-full",
          isOverdue ? "bg-[#D64545]" : "bg-[var(--progress)]"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
