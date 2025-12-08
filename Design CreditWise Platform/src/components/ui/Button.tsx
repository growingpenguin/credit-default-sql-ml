import * as React from "react";
import { cn } from "./utils";

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  ...props
}: ButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonProps>) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[#1A365D] text-white hover:bg-[#0F2240] hover:shadow-md",
    secondary: "bg-white text-[#1A365D] border-2 border-[#1A365D] hover:bg-[#1A365D]/10",
    tertiary: "bg-transparent text-[#0891B2] hover:text-[#1A365D] hover:bg-[#1A365D]/10",
    success: "bg-[#10B981] text-white hover:bg-[#059669]",
    danger: "bg-[#E11D48] text-white hover:bg-[#BE123C]",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-8 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
