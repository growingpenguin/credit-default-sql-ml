/**
 * CreditWise API Service
 * ======================
 * Handles all communication with the FastAPI backend.
 */

// Use Spring Boot (port 8080) or FastAPI (port 8000) based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  credit_score: number | null;
  default_probability: number | null;
  annual_income: number | null;
  credit_limit: number | null;
  credit_utilization: number | null;
  created_at: string | null;
}

export interface UserProfile extends User {
  date_of_birth: string | null;
  employment_status: string | null;
  monthly_expenses: number | null;
  credit_accounts: number | null;
  payment_frequency: string | null;
  longest_delay: string | null;
  desired_loan_amount: number | null;
  loan_purpose: string | null;
  repayment_period: number | null;
  last_score_update: string | null;
  updated_at: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FinancialProfile {
  annual_income?: number;
  monthly_expenses?: number;
  credit_limit?: number;
  credit_accounts?: number;
  payment_frequency?: 'always' | 'usually' | 'sometimes' | 'rarely';
  longest_delay?: 'none' | '1-month' | '2-months';
  credit_utilization?: number;
}

export interface LoanPreferences {
  desired_loan_amount?: number;
  loan_purpose?: 'home' | 'car' | 'education' | 'personal' | 'business';
  repayment_period?: number;
}

export interface CreditScoreResponse {
  credit_score: number;
  score_label: string;
  default_probability: number;
  risk_level: string;
}

// =============================================================================
// LOAN PRODUCT TYPES
// =============================================================================

export interface LoanProduct {
  id: number;
  product_id: string;
  product_name: string;
  lender_name: string;
  loan_type: string;
  grade: string;
  description: string | null;
  min_credit_score: number;
  max_credit_score: number;
  min_apr: number;
  max_apr: number;
  min_amount: number;
  max_amount: number;
  terms_months: string;
  origination_fee_pct: number;
}

export interface PersonalizedLoan {
  product: LoanProduct;
  estimated_apr: number;
  approval_probability: number;
  monthly_payment: number | null;
  is_pre_qualified: boolean;
  is_best_match: boolean;
}

export interface LoanRecommendations {
  credit_score: number;
  total_products: number;
  recommendations: PersonalizedLoan[];
}

export interface LoanPaymentCalc {
  loan_amount: number;
  apr: number;
  term_months: number;
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
}

export interface ApiError {
  detail: string;
}

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

const TOKEN_KEY = 'creditwise_token';
const USER_KEY = 'creditwise_user';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// =============================================================================
// API CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unexpected error occurred',
      }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  async register(data: RegisterData): Promise<AuthResponse> {
    const rawResponse = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Handle both Spring Boot (accessToken) and FastAPI (access_token) formats
    const response = this.normalizeAuthResponse(rawResponse);
    
    setToken(response.access_token);
    setStoredUser(response.user);
    
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const rawResponse = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Handle both Spring Boot (accessToken) and FastAPI (access_token) formats
    const response = this.normalizeAuthResponse(rawResponse);
    
    setToken(response.access_token);
    setStoredUser(response.user);
    
    return response;
  }
  
  /**
   * Normalize auth response to handle different backend formats.
   * Spring Boot: accessToken, fullName (camelCase)
   * FastAPI: access_token, full_name (snake_case)
   */
  private normalizeAuthResponse(raw: any): AuthResponse {
    // Handle token field
    const accessToken = raw.access_token || raw.accessToken;
    const tokenType = raw.token_type || raw.tokenType || 'bearer';
    
    // Handle user field - normalize to snake_case
    const rawUser = raw.user || {};
    const user: User = {
      id: rawUser.id,
      email: rawUser.email,
      full_name: rawUser.full_name || rawUser.fullName || '',
      is_active: rawUser.is_active ?? rawUser.isActive ?? true,
      is_verified: rawUser.is_verified ?? rawUser.isVerified ?? false,
      credit_score: rawUser.credit_score ?? rawUser.creditScore ?? null,
      default_probability: rawUser.default_probability ?? rawUser.defaultProbability ?? null,
      created_at: rawUser.created_at || rawUser.createdAt,
      annual_income: rawUser.annual_income ?? rawUser.annualIncome ?? null,
      credit_limit: rawUser.credit_limit ?? rawUser.creditLimit ?? null,
      credit_utilization: rawUser.credit_utilization ?? rawUser.creditUtilization ?? null,
    };
    
    return {
      access_token: accessToken,
      token_type: tokenType,
      user,
    };
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // ===========================================================================
  // USER PROFILE
  // ===========================================================================

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile');
  }

  async updateFinancialProfile(profile: FinancialProfile): Promise<UserProfile> {
    // Convert snake_case to camelCase for Spring Boot
    const camelCaseProfile = {
      annualIncome: profile.annual_income,
      monthlyExpenses: profile.monthly_expenses,
      creditLimit: profile.credit_limit,
      creditAccounts: profile.credit_accounts,
      paymentFrequency: profile.payment_frequency,
      longestDelay: profile.longest_delay,
      creditUtilization: profile.credit_utilization,
    };
    
    return this.request<UserProfile>('/users/profile/financial', {
      method: 'PUT',
      body: JSON.stringify(camelCaseProfile),
    });
  }

  async updateLoanPreferences(preferences: LoanPreferences): Promise<UserProfile> {
    // Convert snake_case to camelCase for Spring Boot
    const camelCasePrefs = {
      desiredLoanAmount: preferences.desired_loan_amount,
      loanPurpose: preferences.loan_purpose,
      repaymentPeriod: preferences.repayment_period,
    };
    
    return this.request<UserProfile>('/users/profile/loan-preferences', {
      method: 'PUT',
      body: JSON.stringify(camelCasePrefs),
    });
  }

  // ===========================================================================
  // CREDIT SCORE
  // ===========================================================================

  async calculateCreditScore(): Promise<CreditScoreResponse> {
    const raw = await this.request<any>('/users/calculate-score', {
      method: 'POST',
    });
    // Normalize camelCase to snake_case
    return {
      credit_score: raw.credit_score ?? raw.creditScore,
      score_label: raw.score_label ?? raw.scoreLabel,
      default_probability: raw.default_probability ?? raw.defaultProbability,
      risk_level: raw.risk_level ?? raw.riskLevel,
    };
  }

  async getCreditScore(): Promise<CreditScoreResponse> {
    const raw = await this.request<any>('/users/credit-score');
    // Normalize camelCase to snake_case
    return {
      credit_score: raw.credit_score ?? raw.creditScore,
      score_label: raw.score_label ?? raw.scoreLabel,
      default_probability: raw.default_probability ?? raw.defaultProbability,
      risk_level: raw.risk_level ?? raw.riskLevel,
    };
  }

  // ===========================================================================
  // LOAN PRODUCTS (LendingClub-based data)
  // ===========================================================================

  async getAllLoanProducts(loanType?: string): Promise<LoanProduct[]> {
    const params = loanType ? `?loan_type=${loanType}` : '';
    const raw = await this.request<any[]>(`/loans/products${params}`);
    return raw.map(this.normalizeLoanProduct);
  }

  async getLoanProduct(productId: string): Promise<LoanProduct> {
    const raw = await this.request<any>(`/loans/products/${productId}`);
    return this.normalizeLoanProduct(raw);
  }

  async getLoanRecommendations(
    loanType?: string,
    loanAmount?: number,
    termMonths: number = 36
  ): Promise<LoanRecommendations> {
    const params = new URLSearchParams();
    if (loanType) params.append('loan_type', loanType);
    if (loanAmount) params.append('loan_amount', loanAmount.toString());
    params.append('term_months', termMonths.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const raw = await this.request<any>(`/loans/recommendations${queryString}`);
    
    // Normalize response from camelCase to snake_case
    return {
      credit_score: raw.credit_score ?? raw.creditScore,
      total_products: raw.total_products ?? raw.totalProducts,
      recommendations: (raw.recommendations || []).map((r: any) => ({
        product: this.normalizeLoanProduct(r.product),
        estimated_apr: r.estimated_apr ?? r.estimatedApr,
        approval_probability: r.approval_probability ?? r.approvalProbability,
        monthly_payment: r.monthly_payment ?? r.monthlyPayment ?? null,
        is_pre_qualified: r.is_pre_qualified ?? r.isPreQualified,
        is_best_match: r.is_best_match ?? r.isBestMatch,
      })),
    };
  }
  
  /**
   * Normalize loan product from camelCase to snake_case
   */
  private normalizeLoanProduct(raw: any): LoanProduct {
    return {
      id: raw.id,
      product_id: raw.product_id ?? raw.productId,
      product_name: raw.product_name ?? raw.productName,
      lender_name: raw.lender_name ?? raw.lenderName,
      loan_type: raw.loan_type ?? raw.loanType,
      grade: raw.grade,
      description: raw.description,
      min_credit_score: raw.min_credit_score ?? raw.minCreditScore,
      max_credit_score: raw.max_credit_score ?? raw.maxCreditScore,
      min_apr: raw.min_apr ?? raw.minApr,
      max_apr: raw.max_apr ?? raw.maxApr,
      min_amount: raw.min_amount ?? raw.minAmount,
      max_amount: raw.max_amount ?? raw.maxAmount,
      terms_months: raw.terms_months ?? raw.termsMonths,
      origination_fee_pct: raw.origination_fee_pct ?? raw.originationFeePct,
    };
  }

  async calculateLoanPayment(
    amount: number,
    apr: number,
    termMonths: number
  ): Promise<LoanPaymentCalc> {
    return this.request<LoanPaymentCalc>(
      `/loans/calculate-payment?amount=${amount}&apr=${apr}&term_months=${termMonths}`
    );
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const api = new ApiClient(API_BASE_URL);

// =============================================================================
// AUTH CONTEXT HELPERS
// =============================================================================

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const checkAuthOnLoad = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) return null;

  try {
    const user = await api.getCurrentUser();
    setStoredUser(user);
    return user;
  } catch {
    removeToken();
    return null;
  }
};

