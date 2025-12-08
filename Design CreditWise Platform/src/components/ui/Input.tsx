import * as React from "react";
import { cn } from "./utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ 
  className, 
  label, 
  error, 
  type = "text",
  ...props 
}: InputProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-[#1A365D] font-medium text-sm mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "w-full min-w-0 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B]",
          "focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none",
          "transition-all duration-200",
          "placeholder:text-gray-400",
          error && "border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/20",
          className
        )}
        style={{ width: '100%', display: 'block', boxSizing: 'border-box' }}
        {...props}
      />
      {error && (
        <p className="text-[#E11D48] text-sm">{error}</p>
      )}
    </div>
  );
}
