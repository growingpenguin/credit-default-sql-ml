/**
 * Link Bank Account Component
 * ===========================
 * 
 * Simulates bank account linking (like Plaid integration).
 * Allows users to select a demo persona to auto-populate their profile.
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  CUSTOMER_PERSONAS, 
  CustomerPersona,
  getRiskLevelColor,
  formatCurrency,
  getCreditUtilization
} from '../data/mockBankAccounts';
import { 
  Building2, 
  CreditCard, 
  User, 
  Check, 
  ChevronRight,
  Wallet,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Lock
} from 'lucide-react';

interface LinkBankAccountProps {
  onSelectPersona: (persona: CustomerPersona) => void;
  selectedPersonaId?: string;
  onClose?: () => void;
}

export function LinkBankAccount({ onSelectPersona, selectedPersonaId, onClose }: LinkBankAccountProps) {
  const [step, setStep] = useState<'select' | 'connecting' | 'success'>('select');
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null);

  const handleSelectPersona = (persona: CustomerPersona) => {
    setSelectedPersona(persona);
  };

  const handleConnect = async () => {
    if (!selectedPersona) return;
    
    setStep('connecting');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStep('success');
    
    // Notify parent after showing success
    setTimeout(() => {
      onSelectPersona(selectedPersona);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A365D] to-[#0891B2] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Link Bank Account</h2>
              <p className="text-white/80 text-sm">
                {step === 'select' && 'Select a demo profile to simulate bank account linking'}
                {step === 'connecting' && 'Securely connecting to your accounts...'}
                {step === 'success' && 'Successfully connected!'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'select' && (
            <>
              {/* Demo Mode Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Demo Mode</p>
                  <p className="text-sm text-blue-700">
                    Select a customer profile to see how different financial situations affect loan eligibility.
                    In a real app, this would connect to your actual bank via Plaid.
                  </p>
                </div>
              </div>

              {/* Persona Grid */}
              <div className="space-y-3">
                {CUSTOMER_PERSONAS.map((persona) => {
                  const isSelected = selectedPersona?.id === persona.id;
                  const utilization = getCreditUtilization(persona);
                  
                  return (
                    <div
                      key={persona.id}
                      onClick={() => handleSelectPersona(persona)}
                      className={`
                        border-2 rounded-xl p-4 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-[#0891B2] bg-cyan-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="text-4xl">{persona.avatar}</div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#1A365D]">{persona.name}</h3>
                            <span className={`
                              text-xs px-2 py-0.5 rounded-full border capitalize
                              ${getRiskLevelColor(persona.riskLevel)}
                            `}>
                              {persona.riskLevel}
                            </span>
                          </div>
                          
                          <p className="text-sm text-[#64748B] mb-2">{persona.description}</p>
                          
                          {/* Quick Stats */}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1 text-[#64748B]">
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Income: {formatCurrency(persona.annualIncome)}/yr</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#64748B]">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Utilization: {utilization}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#64748B]">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Expected Score: ~{persona.expectedCreditScore}</span>
                            </div>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${isSelected 
                            ? 'border-[#0891B2] bg-[#0891B2]' 
                            : 'border-gray-300'}
                        `}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 'connecting' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#0891B2] border-t-transparent animate-spin"></div>
                <Lock className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1A365D]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A365D] mb-2">
                Connecting to {selectedPersona?.name}'s accounts...
              </h3>
              <p className="text-[#64748B]">
                Securely retrieving financial data from linked institutions
              </p>
              <div className="mt-6 flex justify-center gap-2">
                {selectedPersona?.bankAccounts.map((acc, i) => (
                  <span 
                    key={acc.id}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs text-[#64748B]"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {acc.bankName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A365D] mb-2">
                Accounts Connected!
              </h3>
              <p className="text-[#64748B] mb-4">
                Successfully linked {selectedPersona?.bankAccounts.length} accounts
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">{selectedPersona?.avatar}</span>
                <span className="font-medium text-[#1A365D]">{selectedPersona?.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          {step === 'select' && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConnect}
                disabled={!selectedPersona}
                className="flex items-center gap-2"
              >
                Connect Account
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {step === 'connecting' && (
            <p className="text-sm text-[#64748B] w-full text-center">
              This may take a few seconds...
            </p>
          )}
          
          {step === 'success' && (
            <p className="text-sm text-green-600 w-full text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Redirecting to your dashboard...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default LinkBankAccount;

