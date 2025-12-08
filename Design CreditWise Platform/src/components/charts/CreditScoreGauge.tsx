import React from 'react';

interface CreditScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function CreditScoreGauge({ score, maxScore = 850 }: CreditScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  const getScoreLabel = (score: number) => {
    if (score < 580) return { label: 'Poor', color: '#E11D48' };
    if (score < 670) return { label: 'Fair', color: '#F59E0B' };
    if (score < 740) return { label: 'Good', color: '#10B981' };
    if (score < 800) return { label: 'Very Good', color: '#0891B2' };
    return { label: 'Excellent', color: '#0891B2' };
  };

  const { label, color } = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-32">
        {/* Background Arc */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Poor - Red */}
          <path
            d="M 20 90 A 80 80 0 0 1 50 25"
            fill="none"
            stroke="#E11D48"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Fair - Amber */}
          <path
            d="M 50 25 A 80 80 0 0 1 100 10"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Good - Green */}
          <path
            d="M 100 10 A 80 80 0 0 1 150 25"
            fill="none"
            stroke="#10B981"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Excellent - Teal */}
          <path
            d="M 150 25 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#0891B2"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.2"
          />
          
          {/* Active Arc */}
          <path
            d={`M 20 90 A 80 80 0 ${percentage > 50 ? 1 : 0} 1 ${100 + 80 * Math.cos((rotation * Math.PI) / 180)} ${90 + 80 * Math.sin((rotation * Math.PI) / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <line
            x1="100"
            y1="90"
            x2={100 + 70 * Math.cos((rotation * Math.PI) / 180)}
            y2={90 + 70 * Math.sin((rotation * Math.PI) / 180)}
            stroke="#1A365D"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="90" r="6" fill="#1A365D" />
        </svg>
      </div>

      {/* Score Display */}
      <div className="text-center mt-4">
        <div className="text-[#1A365D]" style={{ fontSize: '3rem', fontWeight: '700', lineHeight: '1' }}>
          {score}
        </div>
        <div className="mt-2" style={{ color }}>
          {label}
        </div>
        <p className="text-[#64748B] mt-1">Out of {maxScore}</p>
      </div>
    </div>
  );
}
