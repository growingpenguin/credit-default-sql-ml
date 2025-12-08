import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { TrendingUp, Shield, Award } from 'lucide-react';

interface LoanCardProps {
  loanType: string;
  lender: string;
  amount: string;
  apr: string;
  approvalProbability: number;
  bestMatch?: boolean;
  preQualified?: boolean;
  onApply: () => void;
}

export function LoanCard({
  loanType,
  lender,
  amount,
  apr,
  approvalProbability,
  bestMatch = false,
  preQualified = false,
  onApply
}: LoanCardProps) {
  return (
    <Card hoverable className="relative overflow-hidden">
      {bestMatch && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white px-4 py-1 rounded-bl-lg flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>Best Match</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-[#1A365D]">{loanType}</h5>
            {preQualified && (
              <Badge variant="success">Pre-Qualified</Badge>
            )}
          </div>
          <p className="text-[#64748B]">{lender}</p>
        </div>

        {/* Amount */}
        <div>
          <p className="text-[#64748B]">Loan Amount</p>
          <div className="text-[#1A365D]">{amount}</div>
        </div>

        {/* APR */}
        <div>
          <p className="text-[#64748B]">Interest Rate</p>
          <div className="text-[#0891B2] flex items-center gap-2">
            <span>{apr}</span>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Approval Probability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#64748B]">Approval Probability</p>
            <span className="text-[#10B981]">{approvalProbability}%</span>
          </div>
          <ProgressBar 
            value={approvalProbability} 
            color={approvalProbability >= 80 ? 'success' : approvalProbability >= 60 ? 'secondary' : 'warning'}
          />
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center gap-2 text-[#64748B] pt-2 border-t border-gray-100">
          <Shield className="w-4 h-4" />
          <span>Verified Lender</span>
        </div>

        {/* Action Button */}
        <Button 
          variant="primary" 
          className="w-full"
          onClick={onApply}
        >
          Apply Now
        </Button>
      </div>
    </Card>
  );
}
