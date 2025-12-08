import * as React from "react";
import { cn } from "./utils";

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({ 
  label, 
  min, 
  max, 
  step = 1, 
  value, 
  onChange,
  formatValue,
  className 
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={cn("w-full space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between w-full">
          <label className="text-[#1A365D] font-medium text-sm">
            {label}
          </label>
          <span className="text-[#0891B2] font-semibold text-lg">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div className="relative w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          style={{
            width: '100%',
            background: `linear-gradient(to right, #0891B2 0%, #0891B2 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #0891B2;
            border: 4px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: transform 0.2s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #0891B2;
            border: 4px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
        `}</style>
      </div>
      <div className="flex justify-between text-sm text-[#64748B] w-full">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
