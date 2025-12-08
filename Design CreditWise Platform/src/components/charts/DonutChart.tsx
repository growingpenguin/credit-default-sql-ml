import React from 'react';

interface DonutChartProps {
  value: number;
  max?: number;
  label: string;
  color?: string;
}

export function DonutChart({ value, max = 100, label, color = '#0891B2' }: DonutChartProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#1A365D]">{Math.round(percentage)}%</span>
        </div>
      </div>
      <p className="text-[#64748B] mt-2 text-center">{label}</p>
    </div>
  );
}
