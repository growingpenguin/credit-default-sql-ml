/**
 * Profile Page
 * ============
 * 
 * Displays user's profile and linked bank accounts.
 * Shows derived financial data from linked accounts.
 */

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User as UserType } from '../../services/api';
import { 
  LinkedBankAccount,
  DerivedFinancialProfile,
  formatCurrency
} from '../../data/bankProviders';
import { 
  User, 
  Building2, 
  CreditCard, 
  Wallet,
  TrendingUp,
  Calendar,
  Plus,
  ChevronRight,
  Trash2,
  PiggyBank,
  Shield,
  Mail,
  Clock
} from 'lucide-react';

interface ProfilePageProps {
  linkedBanks: LinkedBankAccount[];
  derivedProfile: DerivedFinancialProfile | null;
  user: UserType | null;
  onLinkAccount: () => void;
  onUnlinkBank: (bankId: string) => void;
}

export function ProfilePage({ 
  linkedBanks, 
  derivedProfile, 
  user, 
  onLinkAccount, 
  onUnlinkBank 
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts'>('overview');

  // No linked accounts - show prompt to link
  if (linkedBanks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* User Info Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A365D]">{user?.full_name || 'User'}</h1>
              <p className="text-[#64748B] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.email || 'No email'}
              </p>
            </div>
          </div>
        </Card>

        {/* Link Bank Account CTA */}
        <Card className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-[#0891B2]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A365D] mb-2">
            Link Your Bank Account
          </h2>
          <p className="text-[#64748B] mb-6 max-w-md mx-auto">
            Connect your bank accounts to automatically import your financial data. 
            This helps us provide more accurate loan recommendations.
          </p>
          <Button onClick={onLinkAccount} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            Link Bank Account
          </Button>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Shield className="w-4 h-4 text-green-600" />
              <span>256-bit encryption</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Read-only access</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Shield className="w-4 h-4 text-green-600" />
              <span>FDIC protected</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Has linked accounts - show full profile
  const totalAccounts = linkedBanks.reduce((sum, bank) => sum + bank.accounts.length, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A365D]">{user?.full_name || 'User'}</h1>
            <p className="text-[#64748B] text-sm">{user?.email}</p>
          </div>
        </div>
        <Button onClick={onLinkAccount}>
          <Plus className="w-4 h-4 mr-2" />
          Link Another Bank
        </Button>
      </div>

      {/* Quick Stats */}
      {derivedProfile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Credit Score</p>
                <p className="text-xl font-bold text-[#1A365D]">{derivedProfile.estimatedCreditScore}</p>
              </div>
            </div>
          </Card>
          
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Cash Balance</p>
                <p className="text-xl font-bold text-[#1A365D]">{formatCurrency(derivedProfile.totalCashBalance)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Credit Used</p>
                <p className="text-xl font-bold text-[#1A365D]">{derivedProfile.creditUtilization}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Building2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Linked Accounts</p>
                <p className="text-xl font-bold text-[#1A365D]">{totalAccounts}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {(['overview', 'accounts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 font-medium capitalize transition-colors
              ${activeTab === tab 
                ? 'text-[#0891B2] border-b-2 border-[#0891B2]' 
                : 'text-[#64748B] hover:text-[#1A365D]'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && derivedProfile && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Financial Summary */}
          <Card className="!p-5">
            <h3 className="font-semibold text-[#1A365D] mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B] text-sm">Total Cash Balance</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(derivedProfile.totalCashBalance)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B] text-sm">Total Credit Limit</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(derivedProfile.totalCreditLimit)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B] text-sm">Credit Used</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(derivedProfile.totalCreditUsed)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B] text-sm">Credit Utilization</span>
                <span className={`font-medium ${
                  derivedProfile.creditUtilization > 50 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {derivedProfile.creditUtilization}%
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#64748B] text-sm">Est. Annual Income</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(derivedProfile.estimatedAnnualIncome)}</span>
              </div>
            </div>
          </Card>

          {/* Linked Banks */}
          <Card className="!p-5">
            <h3 className="font-semibold text-[#1A365D] mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Linked Banks
            </h3>
            <div className="space-y-3">
              {linkedBanks.map((bank) => (
                <div 
                  key={bank.bankId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bank.bankLogo}</span>
                    <div>
                      <p className="font-medium text-[#1A365D]">{bank.bankName}</p>
                      <p className="text-xs text-[#64748B]">
                        {bank.accounts.length} account{bank.accounts.length !== 1 ? 's' : ''} linked
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUnlinkBank(bank.bankId)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Unlink bank"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {linkedBanks.map((bank) => (
            <div key={bank.bankId}>
              {/* Bank Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{bank.bankLogo}</span>
                  <h3 className="font-semibold text-[#1A365D]">{bank.bankName}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Linked {bank.linkedAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Accounts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bank.accounts.map((account) => (
                  <Card key={account.id} className="!p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        account.type === 'credit' ? 'bg-purple-100' :
                        account.type === 'savings' ? 'bg-green-100' :
                        'bg-blue-100'
                      }`}>
                        {account.type === 'credit' ? (
                          <CreditCard className={`w-5 h-5 ${
                            account.type === 'credit' ? 'text-purple-600' : ''
                          }`} />
                        ) : account.type === 'savings' ? (
                          <PiggyBank className="w-5 h-5 text-green-600" />
                        ) : (
                          <Wallet className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-xs text-[#64748B] px-2 py-1 bg-gray-100 rounded capitalize">
                        {account.type}
                      </span>
                    </div>
                    
                    <p className="font-medium text-[#1A365D] mb-1">{account.name}</p>
                    <p className="text-xs text-[#64748B] mb-3">****{account.lastFour}</p>
                    
                    <p className="text-2xl font-bold text-[#1A365D]">
                      {account.type === 'credit' ? '-' : ''}{formatCurrency(account.balance)}
                    </p>
                    
                    {account.type === 'credit' && account.creditLimit && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#64748B]">Limit: {formatCurrency(account.creditLimit)}</span>
                          <span className={`font-medium ${
                            (account.balance / account.creditLimit) > 0.5 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {Math.round((account.balance / account.creditLimit) * 100)}% used
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (account.balance / account.creditLimit) > 0.7 ? 'bg-red-500' :
                              (account.balance / account.creditLimit) > 0.5 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(account.balance / account.creditLimit) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
