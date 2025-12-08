import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Slider } from './ui/Slider';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface FormData {
  // Personal Info
  fullName: string;
  email: string;
  dateOfBirth: string;
  employmentStatus: string;
  
  // Financial Profile
  annualIncome: number;
  monthlyExpenses: number;
  creditLimit: number;
  creditAccounts: number;
  
  // Payment History
  paymentFrequency: string;
  longestDelay: string;
  creditUtilization: number;
  
  // Loan Requirements
  loanAmount: number;
  loanPurpose: string;
  repaymentPeriod: number;
}

interface FormWizardProps {
  onSubmit: (data: FormData) => void;
}

export function FormWizard({ onSubmit }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    dateOfBirth: '',
    employmentStatus: 'employed',
    annualIncome: 50000,
    monthlyExpenses: 2000,
    creditLimit: 10000,
    creditAccounts: 2,
    paymentFrequency: 'always',
    longestDelay: 'none',
    creditUtilization: 30,
    loanAmount: 25000,
    loanPurpose: 'personal',
    repaymentPeriod: 36,
  });

  const totalSteps = 4;

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className="w-full max-w-[800px] mx-auto px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step < currentStep
                      ? 'bg-[#10B981] text-white'
                      : step === currentStep
                      ? 'bg-[#0891B2] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className="text-[#64748B] mt-2 hidden sm:block">
                  {step === 1 && 'Personal'}
                  {step === 2 && 'Financial'}
                  {step === 3 && 'History'}
                  {step === 4 && 'Loan'}
                </span>
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${step < currentStep ? 'bg-[#10B981]' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-[#1A365D]">Personal Information</h3>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              placeholder="John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="john@example.com"
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
            />
            <Select
              label="Employment Status"
              value={formData.employmentStatus}
              onChange={(e) => updateFormData('employmentStatus', e.target.value)}
              options={[
                { value: 'employed', label: 'Employed' },
                { value: 'self-employed', label: 'Self-employed' },
                { value: 'student', label: 'Student' },
                { value: 'retired', label: 'Retired' },
              ]}
            />
          </div>
        )}

        {/* Step 2: Financial Profile */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-[#1A365D]">Financial Profile</h3>
            <Slider
              label="Annual Income"
              min={10000}
              max={200000}
              step={5000}
              value={formData.annualIncome}
              onChange={(value) => updateFormData('annualIncome', value)}
              formatValue={formatCurrency}
            />
            <Slider
              label="Monthly Expenses"
              min={500}
              max={10000}
              step={100}
              value={formData.monthlyExpenses}
              onChange={(value) => updateFormData('monthlyExpenses', value)}
              formatValue={formatCurrency}
            />
            <Slider
              label="Current Credit Limit"
              min={0}
              max={50000}
              step={1000}
              value={formData.creditLimit}
              onChange={(value) => updateFormData('creditLimit', value)}
              formatValue={formatCurrency}
            />
            <Slider
              label="Number of Credit Accounts"
              min={0}
              max={10}
              step={1}
              value={formData.creditAccounts}
              onChange={(value) => updateFormData('creditAccounts', value)}
            />
          </div>
        )}

        {/* Step 3: Payment History */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-[#1A365D]">Payment History</h3>
            <Select
              label="How often do you pay bills on time?"
              value={formData.paymentFrequency}
              onChange={(e) => updateFormData('paymentFrequency', e.target.value)}
              options={[
                { value: 'always', label: 'Always' },
                { value: 'usually', label: 'Usually' },
                { value: 'sometimes', label: 'Sometimes' },
                { value: 'rarely', label: 'Rarely' },
              ]}
            />
            <Select
              label="Longest payment delay in past 6 months"
              value={formData.longestDelay}
              onChange={(e) => updateFormData('longestDelay', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: '1-month', label: '1 month' },
                { value: '2-months', label: '2+ months' },
              ]}
            />
            <Slider
              label="Current Credit Utilization"
              min={0}
              max={100}
              step={5}
              value={formData.creditUtilization}
              onChange={(value) => updateFormData('creditUtilization', value)}
              formatValue={(v) => `${v}%`}
            />
          </div>
        )}

        {/* Step 4: Loan Requirements */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-[#1A365D]">Loan Requirements</h3>
            <Slider
              label="Desired Loan Amount"
              min={1000}
              max={100000}
              step={1000}
              value={formData.loanAmount}
              onChange={(value) => updateFormData('loanAmount', value)}
              formatValue={formatCurrency}
            />
            <Select
              label="Loan Purpose"
              value={formData.loanPurpose}
              onChange={(e) => updateFormData('loanPurpose', e.target.value)}
              options={[
                { value: 'home', label: 'Home' },
                { value: 'car', label: 'Car' },
                { value: 'education', label: 'Education' },
                { value: 'personal', label: 'Personal' },
                { value: 'business', label: 'Business' },
              ]}
            />
            <Select
              label="Preferred Repayment Period"
              value={formData.repaymentPeriod.toString()}
              onChange={(e) => updateFormData('repaymentPeriod', Number(e.target.value))}
              options={[
                { value: '12', label: '12 months' },
                { value: '24', label: '24 months' },
                { value: '36', label: '36 months' },
                { value: '48', label: '48 months' },
                { value: '60', label: '60 months' },
              ]}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === totalSteps ? 'Submit' : 'Continue'}
            {currentStep < totalSteps && <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
