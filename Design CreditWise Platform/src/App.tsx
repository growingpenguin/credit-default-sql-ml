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
import { 
  api, 
  User, 
  isAuthenticated, 
  checkAuthOnLoad, 
  removeToken,
  FinancialProfile 
} from './services/api';

type Page = 'landing' | 'login' | 'register' | 'check' | 'dashboard' | 'apply' | 'detail' | 'tracker' | 'profile';

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
      setCurrentPage('dashboard');
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
      setCurrentPage('check'); // Go to form wizard after registration
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
      setCurrentPage('landing');
      removeToken();
    }
  };

  // Handle form wizard submission
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

  // Get user display data
  const userData: UserData = {
    name: user?.full_name || 'User',
    email: user?.email || '',
    creditScore: user?.credit_score || 650,
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
            error={error}
          />
        )}
        
        {currentPage === 'check' && (
          <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h2 className="text-[#1A365D] mb-4">Check Your Eligibility</h2>
              <p className="text-[#64748B] text-xl">
                Complete this quick assessment to see your personalized loan options
              </p>
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
            userName={userData.name}
            userEmail={userData.email}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
