/**
 * Link Bank Account Component
 * ===========================
 * 
 * Plaid-like flow for linking bank accounts:
 * 1. Select your bank from major providers
 * 2. Enter login credentials (simulated)
 * 3. Select which accounts to link
 * 4. Success - financial data imported
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { 
  BANK_PROVIDERS, 
  BankProvider,
  DiscoveredAccount,
  LinkedBankAccount,
  generateDiscoveredAccounts,
  formatCurrency
} from '../data/bankProviders';
import { 
  Building2, 
  Search,
  ArrowLeft,
  Lock,
  Check, 
  ChevronRight,
  Eye,
  EyeOff,
  CreditCard,
  Wallet,
  PiggyBank,
  Loader2,
  Shield,
  X
} from 'lucide-react';

type Step = 'select-bank' | 'login' | 'select-accounts' | 'connecting' | 'success';

interface LinkBankAccountProps {
  onComplete: (linkedBank: LinkedBankAccount) => void;
  onClose: () => void;
}

export function LinkBankAccount({ onComplete, onClose }: LinkBankAccountProps) {
  const [step, setStep] = useState<Step>('select-bank');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginValues, setLoginValues] = useState<Record<string, string>>({});
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());

  // Filter banks based on search
  const filteredBanks = BANK_PROVIDERS.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle bank selection
  const handleSelectBank = (bank: BankProvider) => {
    setSelectedBank(bank);
    setLoginValues({});
    setStep('login');
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    setStep('connecting');

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock discovered accounts
    const accounts = generateDiscoveredAccounts(selectedBank.id);
    setDiscoveredAccounts(accounts);
    
    // Pre-select all accounts
    setSelectedAccountIds(new Set(accounts.map(a => a.id)));
    
    setStep('select-accounts');
  };

  // Toggle account selection
  const toggleAccountSelection = (accountId: string) => {
    const newSelection = new Set(selectedAccountIds);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedAccountIds(newSelection);
  };

  // Handle final link
  const handleLinkAccounts = async () => {
    if (!selectedBank || selectedAccountIds.size === 0) return;

    setStep('connecting');

    // Simulate final linking
    await new Promise(resolve => setTimeout(resolve, 1500));

    setStep('success');

    // Build linked bank object
    const linkedBank: LinkedBankAccount = {
      bankId: selectedBank.id,
      bankName: selectedBank.name,
      bankLogo: selectedBank.logo,
      accounts: discoveredAccounts.filter(a => selectedAccountIds.has(a.id)),
      linkedAt: new Date(),
    };

    // Notify parent after showing success
    setTimeout(() => {
      onComplete(linkedBank);
    }, 1500);
  };

  // Go back one step
  const handleBack = () => {
    if (step === 'login') {
      setSelectedBank(null);
      setStep('select-bank');
    } else if (step === 'select-accounts') {
      setStep('login');
    }
  };

  // Get account icon
  const getAccountIcon = (type: DiscoveredAccount['type']) => {
    switch (type) {
      case 'checking': return <Wallet className="w-5 h-5" />;
      case 'savings': return <PiggyBank className="w-5 h-5" />;
      case 'credit': return <CreditCard className="w-5 h-5" />;
    }
  };

  // Use portal to render modal at document body level
  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A365D] to-[#0891B2] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(step === 'login' || step === 'select-accounts') && (
                <button 
                  onClick={handleBack}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold">Link Bank Account</h2>
                <p className="text-white/80 text-sm">
                  {step === 'select-bank' && 'Select your bank'}
                  {step === 'login' && `Sign in to ${selectedBank?.name}`}
                  {step === 'select-accounts' && 'Choose accounts to link'}
                  {step === 'connecting' && 'Connecting securely...'}
                  {step === 'success' && 'Successfully linked!'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Step 1: Select Bank */}
          {step === 'select-bank' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for your bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 focus:border-[#0891B2]"
                />
              </div>

              {/* Bank List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleSelectBank(bank)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#0891B2] hover:bg-cyan-50/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{bank.logo}</span>
                    <span className="flex-1 font-medium text-[#1A365D]">{bank.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                <Shield className="w-4 h-4" />
                <span>Your credentials are encrypted and never stored</span>
              </div>
            </div>
          )}

          {/* Step 2: Login */}
          {step === 'login' && selectedBank && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Bank Header */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{selectedBank.logo}</span>
                <span className="font-medium text-[#1A365D]">{selectedBank.name}</span>
              </div>

              {/* Login Fields */}
              {selectedBank.loginFields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-[#1A365D] mb-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type === 'password' && !showPassword ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={loginValues[field.label] || ''}
                      onChange={(e) => setLoginValues(prev => ({
                        ...prev,
                        [field.label]: e.target.value
                      }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 focus:border-[#0891B2]"
                      required
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Demo Note */}
              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <strong>Demo Mode:</strong> Enter any credentials to simulate login. 
                In production, this connects to your real bank via Plaid.
              </div>

              <Button type="submit" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Sign In Securely
              </Button>
            </form>
          )}

          {/* Step 3: Select Accounts */}
          {step === 'select-accounts' && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">
                We found {discoveredAccounts.length} accounts. Select the ones you want to link:
              </p>

              {/* Account List */}
              <div className="space-y-2">
                {discoveredAccounts.map((account) => {
                  const isSelected = selectedAccountIds.has(account.id);
                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccountSelection(account.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left
                        ${isSelected 
                          ? 'border-[#0891B2] bg-cyan-50' 
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <div className={`p-2 rounded-lg ${
                        account.type === 'credit' ? 'bg-purple-100 text-purple-600' :
                        account.type === 'savings' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getAccountIcon(account.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A365D]">{account.name}</p>
                        <p className="text-xs text-[#64748B]">****{account.lastFour}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-[#1A365D]">
                          {account.type === 'credit' ? '-' : ''}{formatCurrency(account.balance)}
                        </p>
                        {account.type === 'credit' && account.creditLimit && (
                          <p className="text-xs text-[#64748B]">
                            of {formatCurrency(account.creditLimit)}
                          </p>
                        )}
                      </div>

                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'border-[#0891B2] bg-[#0891B2]' 
                          : 'border-gray-300'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={handleLinkAccounts}
                disabled={selectedAccountIds.size === 0}
                className="w-full"
              >
                Link {selectedAccountIds.size} Account{selectedAccountIds.size !== 1 ? 's' : ''}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Connecting State */}
          {step === 'connecting' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#0891B2] border-t-transparent animate-spin"></div>
                <Lock className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1A365D]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A365D] mb-2">
                Connecting Securely
              </h3>
              <p className="text-[#64748B] text-sm">
                Establishing encrypted connection with {selectedBank?.name}...
              </p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A365D] mb-2">
                Accounts Linked!
              </h3>
              <p className="text-[#64748B] text-sm mb-4">
                Successfully connected {selectedAccountIds.size} account{selectedAccountIds.size !== 1 ? 's' : ''} from {selectedBank?.name}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">{selectedBank?.logo}</span>
                <span className="font-medium text-[#1A365D]">{selectedBank?.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render modal using portal to escape any parent overflow/z-index issues
  return createPortal(modalContent, document.body);
}

export default LinkBankAccount;
