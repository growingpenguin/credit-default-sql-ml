/**
 * Mock Bank Accounts & Customer Personas
 * =======================================
 * 
 * Simulates linked bank account data for realistic demo experience.
 * In a real app, this would come from Plaid or internal banking systems.
 * 
 * Personas represent different financial situations:
 * - Excellent: High earner, perfect payment history
 * - Good: Solid finances, minor issues
 * - Average: Middle income, some late payments
 * - Fair: Lower income, payment struggles
 * - Poor: Financial difficulties, high risk
 */

// Types
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  accountNumber: string; // Last 4 digits
  balance: number;
  creditLimit?: number;
  apr?: number;
}

export interface PaymentHistory {
  month: string;
  status: 'on_time' | 'late_1_month' | 'late_2_months' | 'missed';
  amount: number;
  date: string;
}

export interface CreditAccount {
  cardName: string;
  creditLimit: number;
  currentBalance: number;
  minPayment: number;
  apr: number;
  paymentHistory: PaymentHistory[];
}

export interface CustomerPersona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  riskLevel: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  
  // Personal info
  email: string;
  age: number;
  education: 'graduate' | 'university' | 'high_school' | 'other';
  maritalStatus: 'married' | 'single' | 'other';
  employment: string;
  
  // Financial info
  annualIncome: number;
  monthlyExpenses: number;
  
  // Bank accounts
  bankAccounts: BankAccount[];
  
  // Credit accounts (for ML features)
  creditAccounts: CreditAccount[];
  
  // Derived ML features (from UCI dataset format)
  mlFeatures: {
    LIMIT_BAL: number;
    SEX: number;
    EDUCATION: number;
    MARRIAGE: number;
    AGE: number;
    PAY_0: number;
    PAY_2: number;
    PAY_3: number;
    PAY_4: number;
    PAY_5: number;
    PAY_6: number;
    BILL_AMT1: number;
    BILL_AMT2: number;
    BILL_AMT3: number;
    BILL_AMT4: number;
    BILL_AMT5: number;
    BILL_AMT6: number;
    PAY_AMT1: number;
    PAY_AMT2: number;
    PAY_AMT3: number;
    PAY_AMT4: number;
    PAY_AMT5: number;
    PAY_AMT6: number;
  };
  
  // Expected outcomes
  expectedCreditScore: number;
  expectedRiskLevel: string;
  expectedDefaultProb: number;
}

// ============================================================================
// MOCK CUSTOMER PERSONAS
// ============================================================================

export const CUSTOMER_PERSONAS: CustomerPersona[] = [
  // =========================================================================
  // EXCELLENT CREDIT - Sarah Chen
  // =========================================================================
  {
    id: 'excellent-sarah',
    name: 'Sarah Chen',
    avatar: '👩‍💼',
    description: 'Tech executive with perfect payment history',
    riskLevel: 'excellent',
    
    email: 'sarah.chen@demo.com',
    age: 38,
    education: 'graduate',
    maritalStatus: 'married',
    employment: 'Senior Software Engineer at Google',
    
    annualIncome: 185000,
    monthlyExpenses: 4500,
    
    bankAccounts: [
      { id: 'b1', bankName: 'Chase', accountType: 'checking', accountNumber: '4521', balance: 45000 },
      { id: 'b2', bankName: 'Chase', accountType: 'savings', accountNumber: '7832', balance: 125000 },
      { id: 'b3', bankName: 'Fidelity', accountType: 'savings', accountNumber: '9012', balance: 280000 },
    ],
    
    creditAccounts: [
      {
        cardName: 'Chase Sapphire Reserve',
        creditLimit: 50000,
        currentBalance: 3200,
        minPayment: 150,
        apr: 21.99,
        paymentHistory: [
          { month: 'Jun', status: 'on_time', amount: 3500, date: '2024-06-15' },
          { month: 'May', status: 'on_time', amount: 2800, date: '2024-05-15' },
          { month: 'Apr', status: 'on_time', amount: 4100, date: '2024-04-15' },
          { month: 'Mar', status: 'on_time', amount: 3200, date: '2024-03-15' },
          { month: 'Feb', status: 'on_time', amount: 2900, date: '2024-02-15' },
          { month: 'Jan', status: 'on_time', amount: 3800, date: '2024-01-15' },
        ]
      }
    ],
    
    mlFeatures: {
      LIMIT_BAL: 50000,
      SEX: 2,
      EDUCATION: 1,
      MARRIAGE: 1,
      AGE: 38,
      PAY_0: -1,  // Paid duly
      PAY_2: -1,
      PAY_3: -1,
      PAY_4: -1,
      PAY_5: -1,
      PAY_6: -1,
      BILL_AMT1: 3200,
      BILL_AMT2: 3500,
      BILL_AMT3: 2800,
      BILL_AMT4: 4100,
      BILL_AMT5: 3200,
      BILL_AMT6: 2900,
      PAY_AMT1: 3500,
      PAY_AMT2: 2800,
      PAY_AMT3: 4100,
      PAY_AMT4: 3200,
      PAY_AMT5: 2900,
      PAY_AMT6: 3800,
    },
    
    expectedCreditScore: 785,
    expectedRiskLevel: 'Very Low',
    expectedDefaultProb: 0.08,
  },

  // =========================================================================
  // GOOD CREDIT - Michael Johnson
  // =========================================================================
  {
    id: 'good-michael',
    name: 'Michael Johnson',
    avatar: '👨‍💻',
    description: 'Marketing manager, occasional late payment',
    riskLevel: 'good',
    
    email: 'michael.j@demo.com',
    age: 34,
    education: 'university',
    maritalStatus: 'married',
    employment: 'Marketing Manager at Salesforce',
    
    annualIncome: 95000,
    monthlyExpenses: 3200,
    
    bankAccounts: [
      { id: 'b1', bankName: 'Bank of America', accountType: 'checking', accountNumber: '3344', balance: 12500 },
      { id: 'b2', bankName: 'Bank of America', accountType: 'savings', accountNumber: '5566', balance: 35000 },
    ],
    
    creditAccounts: [
      {
        cardName: 'Citi Double Cash',
        creditLimit: 25000,
        currentBalance: 8500,
        minPayment: 250,
        apr: 18.99,
        paymentHistory: [
          { month: 'Jun', status: 'on_time', amount: 1500, date: '2024-06-15' },
          { month: 'May', status: 'on_time', amount: 1200, date: '2024-05-15' },
          { month: 'Apr', status: 'late_1_month', amount: 800, date: '2024-04-25' },
          { month: 'Mar', status: 'on_time', amount: 1400, date: '2024-03-15' },
          { month: 'Feb', status: 'on_time', amount: 1100, date: '2024-02-15' },
          { month: 'Jan', status: 'on_time', amount: 1300, date: '2024-01-15' },
        ]
      }
    ],
    
    mlFeatures: {
      LIMIT_BAL: 25000,
      SEX: 1,
      EDUCATION: 2,
      MARRIAGE: 1,
      AGE: 34,
      PAY_0: 0,   // Paid on time this month
      PAY_2: 0,
      PAY_3: 1,   // 1 month late in April
      PAY_4: 0,
      PAY_5: 0,
      PAY_6: 0,
      BILL_AMT1: 8500,
      BILL_AMT2: 7800,
      BILL_AMT3: 8200,
      BILL_AMT4: 7500,
      BILL_AMT5: 8000,
      BILL_AMT6: 7200,
      PAY_AMT1: 1500,
      PAY_AMT2: 1200,
      PAY_AMT3: 800,
      PAY_AMT4: 1400,
      PAY_AMT5: 1100,
      PAY_AMT6: 1300,
    },
    
    expectedCreditScore: 720,
    expectedRiskLevel: 'Low',
    expectedDefaultProb: 0.18,
  },

  // =========================================================================
  // AVERAGE CREDIT - Emily Rodriguez
  // =========================================================================
  {
    id: 'average-emily',
    name: 'Emily Rodriguez',
    avatar: '👩‍🏫',
    description: 'Teacher with moderate credit utilization',
    riskLevel: 'average',
    
    email: 'emily.r@demo.com',
    age: 29,
    education: 'university',
    maritalStatus: 'single',
    employment: 'High School Teacher',
    
    annualIncome: 58000,
    monthlyExpenses: 2800,
    
    bankAccounts: [
      { id: 'b1', bankName: 'Wells Fargo', accountType: 'checking', accountNumber: '2233', balance: 3500 },
      { id: 'b2', bankName: 'Ally', accountType: 'savings', accountNumber: '8899', balance: 12000 },
    ],
    
    creditAccounts: [
      {
        cardName: 'Capital One Quicksilver',
        creditLimit: 12000,
        currentBalance: 7200,  // 60% utilization
        minPayment: 180,
        apr: 24.99,
        paymentHistory: [
          { month: 'Jun', status: 'on_time', amount: 400, date: '2024-06-15' },
          { month: 'May', status: 'late_1_month', amount: 300, date: '2024-05-28' },
          { month: 'Apr', status: 'on_time', amount: 350, date: '2024-04-15' },
          { month: 'Mar', status: 'on_time', amount: 400, date: '2024-03-15' },
          { month: 'Feb', status: 'late_1_month', amount: 250, date: '2024-02-26' },
          { month: 'Jan', status: 'on_time', amount: 380, date: '2024-01-15' },
        ]
      }
    ],
    
    mlFeatures: {
      LIMIT_BAL: 12000,
      SEX: 2,
      EDUCATION: 2,
      MARRIAGE: 2,
      AGE: 29,
      PAY_0: 0,
      PAY_2: 1,   // Late in May
      PAY_3: 0,
      PAY_4: 0,
      PAY_5: 1,   // Late in Feb
      PAY_6: 0,
      BILL_AMT1: 7200,
      BILL_AMT2: 6800,
      BILL_AMT3: 6500,
      BILL_AMT4: 6200,
      BILL_AMT5: 5900,
      BILL_AMT6: 5600,
      PAY_AMT1: 400,
      PAY_AMT2: 300,
      PAY_AMT3: 350,
      PAY_AMT4: 400,
      PAY_AMT5: 250,
      PAY_AMT6: 380,
    },
    
    expectedCreditScore: 665,
    expectedRiskLevel: 'Medium',
    expectedDefaultProb: 0.32,
  },

  // =========================================================================
  // FAIR CREDIT - David Kim
  // =========================================================================
  {
    id: 'fair-david',
    name: 'David Kim',
    avatar: '👨‍🔧',
    description: 'Freelancer with irregular income, multiple late payments',
    riskLevel: 'fair',
    
    email: 'david.kim@demo.com',
    age: 42,
    education: 'high_school',
    maritalStatus: 'single',
    employment: 'Freelance Mechanic',
    
    annualIncome: 42000,
    monthlyExpenses: 2400,
    
    bankAccounts: [
      { id: 'b1', bankName: 'Credit Union', accountType: 'checking', accountNumber: '1122', balance: 1800 },
    ],
    
    creditAccounts: [
      {
        cardName: 'Discover it',
        creditLimit: 8000,
        currentBalance: 6800,  // 85% utilization
        minPayment: 200,
        apr: 26.99,
        paymentHistory: [
          { month: 'Jun', status: 'late_1_month', amount: 200, date: '2024-06-28' },
          { month: 'May', status: 'late_2_months', amount: 150, date: '2024-05-30' },
          { month: 'Apr', status: 'on_time', amount: 250, date: '2024-04-15' },
          { month: 'Mar', status: 'late_1_month', amount: 200, date: '2024-03-25' },
          { month: 'Feb', status: 'late_1_month', amount: 180, date: '2024-02-27' },
          { month: 'Jan', status: 'on_time', amount: 220, date: '2024-01-15' },
        ]
      }
    ],
    
    mlFeatures: {
      LIMIT_BAL: 8000,
      SEX: 1,
      EDUCATION: 3,
      MARRIAGE: 2,
      AGE: 42,
      PAY_0: 1,   // 1 month late
      PAY_2: 2,   // 2 months late
      PAY_3: 0,
      PAY_4: 1,
      PAY_5: 1,
      PAY_6: 0,
      BILL_AMT1: 6800,
      BILL_AMT2: 6600,
      BILL_AMT3: 6300,
      BILL_AMT4: 6000,
      BILL_AMT5: 5800,
      BILL_AMT6: 5500,
      PAY_AMT1: 200,
      PAY_AMT2: 150,
      PAY_AMT3: 250,
      PAY_AMT4: 200,
      PAY_AMT5: 180,
      PAY_AMT6: 220,
    },
    
    expectedCreditScore: 590,
    expectedRiskLevel: 'High',
    expectedDefaultProb: 0.55,
  },

  // =========================================================================
  // POOR CREDIT - Jessica Brown
  // =========================================================================
  {
    id: 'poor-jessica',
    name: 'Jessica Brown',
    avatar: '👩',
    description: 'Recent job loss, struggling with payments',
    riskLevel: 'poor',
    
    email: 'jessica.b@demo.com',
    age: 26,
    education: 'high_school',
    maritalStatus: 'single',
    employment: 'Currently Unemployed (Retail Associate)',
    
    annualIncome: 28000,
    monthlyExpenses: 2100,
    
    bankAccounts: [
      { id: 'b1', bankName: 'Local Bank', accountType: 'checking', accountNumber: '9988', balance: 450 },
    ],
    
    creditAccounts: [
      {
        cardName: 'Secured Credit Card',
        creditLimit: 500,
        currentBalance: 480,  // 96% utilization
        minPayment: 35,
        apr: 29.99,
        paymentHistory: [
          { month: 'Jun', status: 'late_2_months', amount: 35, date: '2024-06-30' },
          { month: 'May', status: 'late_2_months', amount: 0, date: '2024-05-30' },
          { month: 'Apr', status: 'late_1_month', amount: 35, date: '2024-04-28' },
          { month: 'Mar', status: 'late_2_months', amount: 50, date: '2024-03-30' },
          { month: 'Feb', status: 'late_1_month', amount: 40, date: '2024-02-28' },
          { month: 'Jan', status: 'late_1_month', amount: 45, date: '2024-01-26' },
        ]
      }
    ],
    
    mlFeatures: {
      LIMIT_BAL: 500,
      SEX: 2,
      EDUCATION: 3,
      MARRIAGE: 2,
      AGE: 26,
      PAY_0: 2,   // 2 months late
      PAY_2: 2,
      PAY_3: 1,
      PAY_4: 2,
      PAY_5: 1,
      PAY_6: 1,
      BILL_AMT1: 480,
      BILL_AMT2: 490,
      BILL_AMT3: 450,
      BILL_AMT4: 460,
      BILL_AMT5: 420,
      BILL_AMT6: 380,
      PAY_AMT1: 35,
      PAY_AMT2: 0,
      PAY_AMT3: 35,
      PAY_AMT4: 50,
      PAY_AMT5: 40,
      PAY_AMT6: 45,
    },
    
    expectedCreditScore: 520,
    expectedRiskLevel: 'Very High',
    expectedDefaultProb: 0.78,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get persona by ID
 */
export function getPersonaById(id: string): CustomerPersona | undefined {
  return CUSTOMER_PERSONAS.find(p => p.id === id);
}

/**
 * Get all personas grouped by risk level
 */
export function getPersonasByRisk() {
  return {
    excellent: CUSTOMER_PERSONAS.filter(p => p.riskLevel === 'excellent'),
    good: CUSTOMER_PERSONAS.filter(p => p.riskLevel === 'good'),
    average: CUSTOMER_PERSONAS.filter(p => p.riskLevel === 'average'),
    fair: CUSTOMER_PERSONAS.filter(p => p.riskLevel === 'fair'),
    poor: CUSTOMER_PERSONAS.filter(p => p.riskLevel === 'poor'),
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate credit utilization percentage
 */
export function getCreditUtilization(persona: CustomerPersona): number {
  const totalLimit = persona.creditAccounts.reduce((sum, acc) => sum + acc.creditLimit, 0);
  const totalBalance = persona.creditAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: PaymentHistory['status']): string {
  switch (status) {
    case 'on_time': return 'text-green-600 bg-green-50';
    case 'late_1_month': return 'text-yellow-600 bg-yellow-50';
    case 'late_2_months': return 'text-orange-600 bg-orange-50';
    case 'missed': return 'text-red-600 bg-red-50';
  }
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(risk: CustomerPersona['riskLevel']): string {
  switch (risk) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'average': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'fair': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'poor': return 'text-red-600 bg-red-50 border-red-200';
  }
}

export default CUSTOMER_PERSONAS;

