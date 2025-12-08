/**
 * Bank Providers Data
 * ===================
 * 
 * Simulates real bank options for Plaid-like bank linking.
 * Each bank has mock accounts that would be "discovered" after login.
 */

// Major bank providers
export interface BankProvider {
  id: string;
  name: string;
  logo: string; // emoji for demo
  color: string;
  loginFields: { label: string; type: string; placeholder: string }[];
}

export const BANK_PROVIDERS: BankProvider[] = [
  {
    id: 'chase',
    name: 'Chase',
    logo: '🏦',
    color: '#117ACA',
    loginFields: [
      { label: 'Username', type: 'text', placeholder: 'Enter username' },
      { label: 'Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    logo: '🔴',
    color: '#012169',
    loginFields: [
      { label: 'Online ID', type: 'text', placeholder: 'Enter Online ID' },
      { label: 'Passcode', type: 'password', placeholder: 'Enter passcode' },
    ],
  },
  {
    id: 'wells',
    name: 'Wells Fargo',
    logo: '🟡',
    color: '#D71E28',
    loginFields: [
      { label: 'Username', type: 'text', placeholder: 'Enter username' },
      { label: 'Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  {
    id: 'citi',
    name: 'Citibank',
    logo: '🔵',
    color: '#003B70',
    loginFields: [
      { label: 'User ID', type: 'text', placeholder: 'Enter User ID' },
      { label: 'Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  {
    id: 'usbank',
    name: 'U.S. Bank',
    logo: '🏛️',
    color: '#D50032',
    loginFields: [
      { label: 'Username', type: 'text', placeholder: 'Enter username' },
      { label: 'Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
  {
    id: 'capital',
    name: 'Capital One',
    logo: '💳',
    color: '#004879',
    loginFields: [
      { label: 'Username', type: 'text', placeholder: 'Enter username' },
      { label: 'Password', type: 'password', placeholder: 'Enter password' },
    ],
  },
];

// Mock discovered accounts after "logging in"
export interface DiscoveredAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  lastFour: string;
  balance: number;
  creditLimit?: number;  // Only for credit accounts
  apr?: number;          // Only for credit accounts
}

// Generate random realistic accounts for any bank
export function generateDiscoveredAccounts(bankId: string): DiscoveredAccount[] {
  const accounts: DiscoveredAccount[] = [];
  
  // Always have a checking account
  accounts.push({
    id: `${bankId}-checking`,
    name: 'Primary Checking',
    type: 'checking',
    lastFour: generateLastFour(),
    balance: randomBetween(2500, 15000),
  });
  
  // 70% chance of savings account
  if (Math.random() > 0.3) {
    accounts.push({
      id: `${bankId}-savings`,
      name: 'Savings Account',
      type: 'savings',
      lastFour: generateLastFour(),
      balance: randomBetween(5000, 50000),
    });
  }
  
  // 80% chance of a credit card
  if (Math.random() > 0.2) {
    const creditLimit = randomBetween(5000, 25000);
    const utilization = Math.random() * 0.6; // 0-60% utilization
    accounts.push({
      id: `${bankId}-credit`,
      name: 'Rewards Credit Card',
      type: 'credit',
      lastFour: generateLastFour(),
      balance: Math.round(creditLimit * utilization),
      creditLimit,
      apr: randomBetween(15, 25),
    });
  }
  
  return accounts;
}

// Linked account with selection state
export interface LinkedBankAccount {
  bankId: string;
  bankName: string;
  bankLogo: string;
  accounts: DiscoveredAccount[];
  linkedAt: Date;
}

// Financial profile derived from linked accounts
export interface DerivedFinancialProfile {
  totalCashBalance: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  creditUtilization: number;
  accountsCount: number;
  estimatedAnnualIncome: number;  // Based on balance patterns
  estimatedCreditScore: number;   // Based on utilization and accounts
}

// Calculate financial profile from linked accounts
export function calculateDerivedProfile(linkedAccounts: LinkedBankAccount[]): DerivedFinancialProfile {
  let totalCashBalance = 0;
  let totalCreditLimit = 0;
  let totalCreditUsed = 0;
  let accountsCount = 0;
  
  for (const bank of linkedAccounts) {
    for (const account of bank.accounts) {
      accountsCount++;
      if (account.type === 'checking' || account.type === 'savings') {
        totalCashBalance += account.balance;
      } else if (account.type === 'credit') {
        totalCreditLimit += account.creditLimit || 0;
        totalCreditUsed += account.balance;
      }
    }
  }
  
  const creditUtilization = totalCreditLimit > 0 
    ? Math.round((totalCreditUsed / totalCreditLimit) * 100) 
    : 0;
  
  // Estimate annual income based on cash balance (rough heuristic)
  const estimatedAnnualIncome = Math.round(totalCashBalance * 4);
  
  // Estimate credit score based on utilization and accounts
  let estimatedCreditScore = 650; // Base score
  
  // Lower utilization = higher score
  if (creditUtilization < 10) estimatedCreditScore += 80;
  else if (creditUtilization < 30) estimatedCreditScore += 50;
  else if (creditUtilization < 50) estimatedCreditScore += 20;
  else if (creditUtilization > 70) estimatedCreditScore -= 30;
  
  // More accounts with good standing = higher score
  estimatedCreditScore += Math.min(accountsCount * 10, 40);
  
  // Higher income = slightly higher score
  if (estimatedAnnualIncome > 100000) estimatedCreditScore += 30;
  else if (estimatedAnnualIncome > 60000) estimatedCreditScore += 15;
  
  // Cap the score
  estimatedCreditScore = Math.min(Math.max(estimatedCreditScore, 300), 850);
  
  return {
    totalCashBalance,
    totalCreditLimit,
    totalCreditUsed,
    creditUtilization,
    accountsCount,
    estimatedAnnualIncome,
    estimatedCreditScore,
  };
}

// Utility functions
function generateLastFour(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

// Format helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

