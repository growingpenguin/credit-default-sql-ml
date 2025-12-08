import * as React from "react";
import { cn } from "./utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-md w-full",
        hoverable && "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer",
        className
      )}
      style={{ padding: '24px', boxSizing: 'border-box' }}
      {...props}
    >
      {children}
    </div>
  );
}

// StatCard component for displaying stats with icons
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  status: 'good' | 'warning' | 'error';
}

export function StatCard({ icon, title, value, trend, status }: StatCardProps) {
  const statusColors = {
    good: 'text-[#10B981]',
    warning: 'text-[#F59E0B]',
    error: 'text-[#E11D48]',
  };

  const statusBgColors = {
    good: 'bg-[#10B981]/10',
    warning: 'bg-[#F59E0B]/10',
    error: 'bg-[#E11D48]/10',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", statusBgColors[status])}>
          <span className={statusColors[status]}>{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-[#64748B] text-sm">{title}</p>
          <p className="text-[#1A365D] text-2xl font-bold">{value}</p>
          <p className={cn("text-sm mt-1", statusColors[status])}>{trend}</p>
        </div>
      </div>
    </div>
  );
}
