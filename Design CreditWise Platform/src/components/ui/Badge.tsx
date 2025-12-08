import * as React from "react";
import { cn } from "./utils";

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ 
  variant = 'default', 
  children, 
  className 
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#1A365D]/10 text-[#1A365D]",
    success: "bg-[#10B981]/10 text-[#10B981]",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
    error: "bg-[#E11D48]/10 text-[#E11D48]",
    secondary: "bg-[#0891B2]/10 text-[#0891B2]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
