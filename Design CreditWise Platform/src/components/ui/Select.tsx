import * as React from "react";
import { cn } from "./utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({ 
  className, 
  label, 
  options,
  value,
  onChange,
  ...props 
}: SelectProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-[#1A365D] font-medium text-sm mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={cn(
          "w-full min-w-0 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B]",
          "focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none",
          "transition-all duration-200",
          "appearance-none cursor-pointer",
          className
        )}
        style={{
          width: '100%',
          display: 'block',
          boxSizing: 'border-box',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
