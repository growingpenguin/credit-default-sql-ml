import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Shield, FileText, CheckCircle, MessageCircle, Download } from 'lucide-react';

interface ApplicationDetailPageProps {
  loanType: string;
  onApply: () => void;
  onBack: () => void;
}

export function ApplicationDetailPage({ loanType, onApply, onBack }: ApplicationDetailPageProps) {
  const [loanAmount, setLoanAmount] = useState(25000);
  const [loanTerm, setLoanTerm] = useState(36);

  // Calculate monthly payment (simple interest formula for demonstration)
  const interestRate = 0.079; // 7.9% APR
  const monthlyRate = interestRate / 12;
  const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / 
                         (Math.pow(1 + monthlyRate, loanTerm) - 1);
  const totalInterest = (monthlyPayment * loanTerm) - loanAmount;
  const totalRepayment = loanAmount + totalInterest;

  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <button 
        onClick={onBack}
        className="text-[#0891B2] hover:underline mb-4 text-sm font-medium"
      >
        ← Back to Dashboard
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Loan Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[#1A365D] text-2xl font-bold">Personal Loan</h2>
              <Badge variant="success">Pre-Qualified</Badge>
            </div>
            <div className="flex items-center gap-2 text-[#64748B] text-sm">
              <span>CreditWise Partners</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Verified Lender</span>
              </div>
            </div>
          </div>

          {/* Loan Customization */}
          <Card className="!p-5">
            <h4 className="text-[#1A365D] text-lg font-semibold mb-4">Customize Your Loan</h4>
            
            <div className="space-y-5">
              <Slider
                label="Loan Amount"
                min={1000}
                max={50000}
                step={1000}
                value={loanAmount}
                onChange={setLoanAmount}
                formatValue={formatCurrency}
              />

              <Slider
                label="Loan Term"
                min={12}
                max={60}
                step={12}
                value={loanTerm}
                onChange={setLoanTerm}
                formatValue={(v) => `${v} months`}
              />

              {/* Key Terms */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-[#64748B] text-xs mb-0.5">Interest Rate (APR)</p>
                  <p className="text-[#1A365D] font-medium">7.9%</p>
                </div>
                <div>
                  <p className="text-[#64748B] text-xs mb-0.5">Monthly Payment</p>
                  <p className="text-[#0891B2] font-semibold">{formatCurrency(monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-[#64748B] text-xs mb-0.5">Total Interest</p>
                  <p className="text-[#1A365D] font-medium">{formatCurrency(totalInterest)}</p>
                </div>
                <div>
                  <p className="text-[#64748B] text-xs mb-0.5">Total Repayment</p>
                  <p className="text-[#1A365D] font-medium">{formatCurrency(totalRepayment)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Amortization Preview */}
          <Card className="!p-5">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[#1A365D] font-semibold">Repayment Schedule Preview</h5>
              <button className="text-[#0891B2] hover:underline text-sm flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                Download Full Schedule
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-[#64748B] font-medium">Month</th>
                    <th className="text-right py-2 text-[#64748B] font-medium">Payment</th>
                    <th className="text-right py-2 text-[#64748B] font-medium">Principal</th>
                    <th className="text-right py-2 text-[#64748B] font-medium">Interest</th>
                    <th className="text-right py-2 text-[#64748B] font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((month) => {
                    const interest = loanAmount * monthlyRate;
                    const principal = monthlyPayment - interest;
                    const balance = loanAmount - (principal * month);
                    
                    return (
                      <tr key={month} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 text-[#1A365D]">{month}</td>
                        <td className="text-right py-2 text-[#1A365D] font-medium">{formatCurrency(monthlyPayment)}</td>
                        <td className="text-right py-2 text-[#64748B]">{formatCurrency(principal)}</td>
                        <td className="text-right py-2 text-[#64748B]">{formatCurrency(interest)}</td>
                        <td className="text-right py-2 text-[#1A365D]">{formatCurrency(balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Required Documents */}
          <Card className="!p-5">
            <h5 className="text-[#1A365D] font-semibold mb-3">Required Documents</h5>
            <div className="space-y-2">
              {[
                'Valid government-issued ID',
                'Proof of income (pay stubs or tax returns)',
                'Bank statements (last 3 months)',
                'Proof of address',
              ].map((doc, index) => (
                <div key={index} className="flex items-center gap-2 text-[#64748B] text-sm">
                  <FileText className="w-4 h-4 text-[#0891B2]" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div>
          {/* Summary Card */}
          <Card className="sticky top-20 !p-5">
            <h5 className="text-[#1A365D] font-semibold mb-4">Application Summary</h5>
            
            {/* Approval Probability */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#64748B] text-sm">Approval Probability</span>
                <span className="text-[#10B981] font-bold">87%</span>
              </div>
              <ProgressBar value={87} color="success" />
              <p className="text-[#64748B] text-xs mt-1.5">
                Based on your credit profile
              </p>
            </div>

            {/* Key Details */}
            <div className="space-y-2.5 py-3 border-y border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Loan Amount</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Monthly Payment</span>
                <span className="text-[#0891B2] font-semibold">{formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Loan Term</span>
                <span className="text-[#1A365D] font-medium">{loanTerm} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Interest Rate</span>
                <span className="text-[#1A365D] font-medium">7.9% APR</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-4">
              <Button className="w-full" onClick={onApply}>
                Apply Now
              </Button>
              <Button variant="secondary" className="w-full">
                Save for Later
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-[#64748B] text-xs">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B] text-xs">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>FDIC Member Bank</span>
              </div>
            </div>

            {/* Support */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="flex items-center gap-2 text-[#0891B2] hover:underline text-sm">
                <MessageCircle className="w-4 h-4" />
                <span>Questions? Chat with us</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
