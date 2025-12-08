/**
 * Profile Page
 * ============
 * 
 * Displays user's linked bank account data and financial profile.
 * Allows switching between demo personas or editing details.
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  CustomerPersona,
  formatCurrency,
  getCreditUtilization,
  getRiskLevelColor,
  getPaymentStatusColor
} from '../../data/mockBankAccounts';
import { 
  User, 
  Building2, 
  CreditCard, 
  Wallet,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit,
  Unlink
} from 'lucide-react';

interface ProfilePageProps {
  persona: CustomerPersona | null;
  onLinkAccount: () => void;
  onUnlinkAccount: () => void;
}

export function ProfilePage({ persona, onLinkAccount, onUnlinkAccount }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'history'>('overview');

  if (!persona) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A365D] mb-2">
            No Bank Account Linked
          </h2>
          <p className="text-[#64748B] mb-6 max-w-md mx-auto">
            Link a bank account to automatically import your financial data and get personalized loan recommendations.
          </p>
          <Button onClick={onLinkAccount} className="mx-auto">
            <Building2 className="w-4 h-4 mr-2" />
            Link Bank Account
          </Button>
        </Card>
      </div>
    );
  }

  const utilization = getCreditUtilization(persona);
  const totalBalance = persona.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalCreditLimit = persona.creditAccounts.reduce((sum, acc) => sum + acc.creditLimit, 0);
  const totalCreditUsed = persona.creditAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{persona.avatar}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A365D]">{persona.name}</h1>
              <span className={`
                text-xs px-2 py-0.5 rounded-full border capitalize
                ${getRiskLevelColor(persona.riskLevel)}
              `}>
                {persona.riskLevel} credit
              </span>
            </div>
            <p className="text-[#64748B]">{persona.employment}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onLinkAccount}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Switch Profile
          </Button>
          <Button variant="ghost" onClick={onUnlinkAccount}>
            <Unlink className="w-4 h-4 mr-2" />
            Unlink
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Expected Score</p>
              <p className="text-xl font-bold text-[#1A365D]">{persona.expectedCreditScore}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Total Balance</p>
              <p className="text-xl font-bold text-[#1A365D]">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Credit Used</p>
              <p className="text-xl font-bold text-[#1A365D]">{utilization}%</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Monthly Income</p>
              <p className="text-xl font-bold text-[#1A365D]">{formatCurrency(persona.annualIncome / 12)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {(['overview', 'accounts', 'history'] as const).map((tab) => (
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
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-[#1A365D] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Email</span>
                <span className="text-[#1A365D]">{persona.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Age</span>
                <span className="text-[#1A365D]">{persona.age} years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Education</span>
                <span className="text-[#1A365D] capitalize">{persona.education.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Marital Status</span>
                <span className="text-[#1A365D] capitalize">{persona.maritalStatus}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#64748B]">Employment</span>
                <span className="text-[#1A365D] text-right max-w-[200px]">{persona.employment}</span>
              </div>
            </div>
          </Card>

          {/* Financial Summary */}
          <Card className="p-6">
            <h3 className="font-semibold text-[#1A365D] mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Annual Income</span>
                <span className="text-[#1A365D] font-medium">{formatCurrency(persona.annualIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Monthly Expenses</span>
                <span className="text-[#1A365D]">{formatCurrency(persona.monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Total Credit Limit</span>
                <span className="text-[#1A365D]">{formatCurrency(totalCreditLimit)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[#64748B]">Credit Utilization</span>
                <span className={`font-medium ${utilization > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                  {utilization}%
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#64748B]">Default Probability</span>
                <span className={`font-medium ${
                  persona.expectedDefaultProb < 0.2 ? 'text-green-600' :
                  persona.expectedDefaultProb < 0.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(persona.expectedDefaultProb * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Bank Accounts */}
          <h3 className="font-semibold text-[#1A365D] flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Linked Bank Accounts
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {persona.bankAccounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[#1A365D]">{account.bankName}</span>
                  <span className="text-xs text-[#64748B] px-2 py-1 bg-gray-100 rounded capitalize">
                    {account.accountType}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#1A365D] mb-1">
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-sm text-[#64748B]">****{account.accountNumber}</p>
              </Card>
            ))}
          </div>

          {/* Credit Accounts */}
          <h3 className="font-semibold text-[#1A365D] flex items-center gap-2 mt-8">
            <CreditCard className="w-5 h-5" />
            Credit Cards
          </h3>
          <div className="space-y-4">
            {persona.creditAccounts.map((card, index) => (
              <Card key={index} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-[#1A365D]">{card.cardName}</h4>
                    <p className="text-sm text-[#64748B]">APR: {card.apr}%</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-[#64748B]">Balance</p>
                      <p className="font-semibold text-[#1A365D]">{formatCurrency(card.currentBalance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#64748B]">Limit</p>
                      <p className="font-semibold text-[#1A365D]">{formatCurrency(card.creditLimit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#64748B]">Min Payment</p>
                      <p className="font-semibold text-[#1A365D]">{formatCurrency(card.minPayment)}</p>
                    </div>
                  </div>
                </div>
                {/* Utilization Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748B]">Utilization</span>
                    <span className={`font-medium ${
                      (card.currentBalance / card.creditLimit) > 0.5 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {Math.round((card.currentBalance / card.creditLimit) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (card.currentBalance / card.creditLimit) > 0.7 ? 'bg-red-500' :
                        (card.currentBalance / card.creditLimit) > 0.5 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(card.currentBalance / card.creditLimit) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {persona.creditAccounts.map((card, cardIndex) => (
            <Card key={cardIndex} className="p-6">
              <h3 className="font-semibold text-[#1A365D] mb-4">{card.cardName} - Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-3 text-[#64748B] font-medium">Month</th>
                      <th className="pb-3 text-[#64748B] font-medium">Date</th>
                      <th className="pb-3 text-[#64748B] font-medium">Amount</th>
                      <th className="pb-3 text-[#64748B] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.paymentHistory.map((payment, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-[#1A365D]">{payment.month}</td>
                        <td className="py-3 text-[#64748B]">{payment.date}</td>
                        <td className="py-3 text-[#1A365D] font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3">
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                            ${getPaymentStatusColor(payment.status)}
                          `}>
                            {payment.status === 'on_time' && <CheckCircle2 className="w-3 h-3" />}
                            {payment.status === 'late_1_month' && <Clock className="w-3 h-3" />}
                            {payment.status === 'late_2_months' && <AlertCircle className="w-3 h-3" />}
                            {payment.status === 'missed' && <AlertCircle className="w-3 h-3" />}
                            {payment.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
