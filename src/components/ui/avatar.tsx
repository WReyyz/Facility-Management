import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  size?: "sm" | "default" | "lg";
}

const PASTEL_COLORS = [
  { bg: "#E6EEFF", text: "#2B59C3" },
  { bg: "#E3F5E8", text: "#1F7A3D" },
  { bg: "#FFF1D6", text: "#8F5600" },
  { bg: "#EFE8FD", text: "#5B3FB5" },
  { bg: "#FDE8F1", text: "#B02A66" },
];

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name?: string) {
  if (!name) return PASTEL_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}

export function Avatar({
  name,
  size = "default",
  className,
  ...props
}: AvatarProps) {
  const { bg, text } = getColor(name);
  const initials = getInitials(name);

  const sizes = {
    sm: "h-6 w-6 text-[10px]",
    default: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full select-none shrink-0",
        sizes[size],
        className
      )}
      style={{ backgroundColor: bg, color: text }}
      {...props}
    >
      {initials}
    </div>
  );
}
