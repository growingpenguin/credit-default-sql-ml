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
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    setToken(response.access_token);
    setStoredUser(response.user);
    
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    setToken(response.access_token);
    setStoredUser(response.user);
    
    return response;
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
    return this.request<UserProfile>('/users/profile/financial', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async updateLoanPreferences(preferences: LoanPreferences): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile/loan-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // ===========================================================================
  // CREDIT SCORE
  // ===========================================================================

  async calculateCreditScore(): Promise<CreditScoreResponse> {
    return this.request<CreditScoreResponse>('/users/calculate-score', {
      method: 'POST',
    });
  }

  async getCreditScore(): Promise<CreditScoreResponse> {
    return this.request<CreditScoreResponse>('/users/credit-score');
  }

  // ===========================================================================
  // LOAN PRODUCTS (LendingClub-based data)
  // ===========================================================================

  async getAllLoanProducts(loanType?: string): Promise<LoanProduct[]> {
    const params = loanType ? `?loan_type=${loanType}` : '';
    return this.request<LoanProduct[]>(`/loans/products${params}`);
  }

  async getLoanProduct(productId: string): Promise<LoanProduct> {
    return this.request<LoanProduct>(`/loans/products/${productId}`);
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
    return this.request<LoanRecommendations>(`/loans/recommendations${queryString}`);
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

