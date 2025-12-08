import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/pages/LandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { ApplicationDetailPage } from './components/pages/ApplicationDetailPage';
import { ApplicationTrackerPage } from './components/pages/ApplicationTrackerPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { FormWizard } from './components/FormWizard';
import { LoginPage } from './components/pages/LoginPage';
import { ForgotPasswordPage } from './components/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './components/pages/ResetPasswordPage';
import { LinkBankAccount } from './components/LinkBankAccount';
import { CustomerPersona, CUSTOMER_PERSONAS } from './data/mockBankAccounts';
import { 
  api, 
  User, 
  isAuthenticated, 
  checkAuthOnLoad, 
  removeToken,
  FinancialProfile 
} from './services/api';

type Page = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'check' | 'dashboard' | 'apply' | 'detail' | 'tracker' | 'profile';

interface UserData {
  name: string;
  email: string;
  creditScore: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState('personal');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mock bank account state
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Password reset state
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticatedUser = await checkAuthOnLoad();
        if (authenticatedUser) {
          setUser(authenticatedUser);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
      setIsLoggedIn(true);
      
      // If no persona linked, show link modal, otherwise go to dashboard
      if (!selectedPersona) {
        setShowLinkModal(true);
      } else {
        setCurrentPage('dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  // Handle registration
  const handleRegister = async (email: string, password: string, fullName: string) => {
    setError(null);
    try {
      const response = await api.register({ email, password, full_name: fullName });
      setUser(response.user);
      setIsLoggedIn(true);
      // Show link bank account after registration
      setShowLinkModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setSelectedPersona(null);
      setCurrentPage('landing');
      removeToken();
    }
  };

  // Handle persona selection (simulated bank account linking)
  const handleSelectPersona = async (persona: CustomerPersona) => {
    setSelectedPersona(persona);
    setShowLinkModal(false);
    
    // Update user with persona data
    setUser(prev => prev ? {
      ...prev,
      full_name: persona.name,
      credit_score: persona.expectedCreditScore,
      default_probability: persona.expectedDefaultProb,
    } : null);

    // Try to sync with backend
    try {
      const financialProfile: FinancialProfile = {
        annual_income: persona.annualIncome,
        monthly_expenses: persona.monthlyExpenses,
        credit_limit: persona.mlFeatures.LIMIT_BAL,
        credit_accounts: persona.creditAccounts.length,
        payment_frequency: persona.mlFeatures.PAY_0 <= 0 ? 'always' : 
                          persona.mlFeatures.PAY_0 === 1 ? 'usually' : 'sometimes',
        credit_utilization: Math.round((persona.mlFeatures.BILL_AMT1 / persona.mlFeatures.LIMIT_BAL) * 100),
      };
      await api.updateFinancialProfile(financialProfile);
    } catch (err) {
      console.log('Backend sync skipped (demo mode)');
    }

    setCurrentPage('dashboard');
  };

  // Handle form wizard submission (for manual entry)
  const handleFormSubmit = async (formData: any) => {
    try {
      // Update user's financial profile in backend
      const financialProfile: FinancialProfile = {
        annual_income: formData.annualIncome,
        monthly_expenses: formData.monthlyExpenses,
        credit_limit: formData.creditLimit,
        credit_accounts: formData.creditAccounts,
        payment_frequency: formData.paymentFrequency,
        longest_delay: formData.longestDelay,
        credit_utilization: formData.creditUtilization,
      };

      await api.updateFinancialProfile(financialProfile);

      // Update loan preferences
      await api.updateLoanPreferences({
        desired_loan_amount: formData.loanAmount,
        loan_purpose: formData.loanPurpose,
        repayment_period: formData.repaymentPeriod,
      });

      // Calculate credit score
      const scoreResponse = await api.calculateCreditScore();
      
      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        credit_score: scoreResponse.credit_score,
        default_probability: scoreResponse.default_probability,
      } : null);

      setCurrentPage('dashboard');
    } catch (err) {
      console.error('Error submitting form:', err);
      // Fallback to local calculation if API fails
      const calculatedScore = calculateCreditScoreLocally(formData);
      setUser(prev => prev ? {
        ...prev,
        credit_score: calculatedScore,
        full_name: formData.fullName || prev.full_name,
      } : null);
      setCurrentPage('dashboard');
    }
  };

  // Local credit score calculation (fallback)
  const calculateCreditScoreLocally = (formData: any) => {
    let score = 600;
    
    if (formData.annualIncome > 80000) score += 50;
    else if (formData.annualIncome > 50000) score += 30;
    else if (formData.annualIncome > 30000) score += 15;
    
    if (formData.paymentFrequency === 'always') score += 60;
    else if (formData.paymentFrequency === 'usually') score += 40;
    else if (formData.paymentFrequency === 'sometimes') score += 20;
    
    if (formData.creditUtilization < 30) score += 40;
    else if (formData.creditUtilization < 50) score += 25;
    else if (formData.creditUtilization < 70) score += 10;
    
    if (formData.longestDelay === 'none') score += 30;
    else if (formData.longestDelay === '1-month') score -= 10;
    else score -= 30;
    
    if (formData.creditAccounts > 3) score += 20;
    
    return Math.min(Math.max(score, 300), 850);
  };

  const handleApplyLoan = (loanType: string) => {
    setSelectedLoan(loanType);
    setCurrentPage('detail');
  };

  const handleNavigate = (page: string) => {
    if (page === 'login') {
      setCurrentPage('login');
    } else if (page === 'register') {
      setCurrentPage('register');
    } else if (page === 'check') {
      setCurrentPage(isLoggedIn ? 'check' : 'login');
    } else if (page === 'dashboard') {
      setCurrentPage(isLoggedIn ? 'dashboard' : 'login');
    } else if (page === 'apply') {
      setCurrentPage('detail');
    } else if (page === 'profile') {
      setCurrentPage('profile');
    } else if (page === 'landing') {
      setCurrentPage('landing');
    } else if (page === 'logout') {
      handleLogout();
    } else {
      setCurrentPage('landing');
    }
  };

  const handleStartApplication = () => {
    setCurrentPage('tracker');
  };

  // Handle password reset request
  const handleForgotPassword = () => {
    setCurrentPage('forgot-password');
  };

  // Handle reset token received (from forgot password page)
  const handleResetToken = (token: string) => {
    setResetToken(token);
    setCurrentPage('reset-password');
  };

  // Handle password reset submission
  const handleResetPassword = async (newPassword: string) => {
    // Simulate API call - in production this would call the backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In demo mode, just show success
    // In production: await api.resetPassword(resetToken, newPassword);
    
    setResetToken(null);
    // Return to login page after successful reset
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0891B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading CreditWise...</p>
        </div>
      </div>
    );
  }

  // Get user display data (prefer persona data if linked)
  const userData: UserData = {
    name: selectedPersona?.name || user?.full_name || 'User',
    email: selectedPersona?.email || user?.email || '',
    creditScore: selectedPersona?.expectedCreditScore || user?.credit_score || 650,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage onGetStarted={() => setCurrentPage(isLoggedIn ? 'check' : 'login')} />
        )}

        {(currentPage === 'login' || currentPage === 'register') && (
          <LoginPage
            mode={currentPage}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSwitchMode={() => setCurrentPage(currentPage === 'login' ? 'register' : 'login')}
            onForgotPassword={handleForgotPassword}
            error={error}
          />
        )}

        {currentPage === 'forgot-password' && (
          <ForgotPasswordPage
            onBack={() => setCurrentPage('login')}
            onResetPassword={handleResetToken}
          />
        )}

        {currentPage === 'reset-password' && resetToken && (
          <ResetPasswordPage
            token={resetToken}
            onReset={handleResetPassword}
            onBack={() => setCurrentPage('login')}
          />
        )}
        
        {currentPage === 'check' && (
          <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h2 className="text-[#1A365D] mb-4">Check Your Eligibility</h2>
              <p className="text-[#64748B] text-xl mb-6">
                Complete this quick assessment to see your personalized loan options
              </p>
              {/* Quick Link Bank Option */}
              <button
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-[#0891B2] rounded-lg hover:bg-cyan-100 transition-colors mb-8"
              >
                <span className="text-lg">🏦</span>
                <span>Or link bank account to auto-fill</span>
              </button>
            </div>
            <FormWizard onSubmit={handleFormSubmit} />
          </div>
        )}
        
        {currentPage === 'dashboard' && (
          <DashboardPage 
            userName={userData.name}
            creditScore={userData.creditScore}
            onApplyLoan={handleApplyLoan}
          />
        )}
        
        {currentPage === 'detail' && (
          <ApplicationDetailPage
            loanType={selectedLoan}
            onApply={handleStartApplication}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}
        
        {currentPage === 'tracker' && (
          <ApplicationTrackerPage onBack={() => setCurrentPage('dashboard')} />
        )}
        
        {currentPage === 'profile' && (
          <ProfilePage
            persona={selectedPersona}
            onLinkAccount={() => setShowLinkModal(true)}
            onUnlinkAccount={() => {
              setSelectedPersona(null);
              setUser(prev => prev ? { ...prev, credit_score: 650 } : null);
            }}
          />
        )}
      </main>
      
      <Footer />

      {/* Link Bank Account Modal */}
      {showLinkModal && (
        <LinkBankAccount
          onSelectPersona={handleSelectPersona}
          selectedPersonaId={selectedPersona?.id}
          onClose={() => {
            setShowLinkModal(false);
            if (currentPage === 'login' || currentPage === 'register') {
              setCurrentPage('check');
            }
          }}
        />
      )}
    </div>
  );
}
