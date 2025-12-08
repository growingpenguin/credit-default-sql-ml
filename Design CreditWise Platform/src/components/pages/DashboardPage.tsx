import React, { useState, useEffect } from 'react';
import { Card, StatCard } from '../ui/Card';
import { CreditScoreGauge } from '../charts/CreditScoreGauge';
import { DonutChart } from '../charts/DonutChart';
import { LoanCard } from '../LoanCard';
import { TrendingUp, CreditCard, Clock, Search, Lightbulb, Calculator, Loader2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { api, PersonalizedLoan, LoanProduct } from '../../services/api';

interface DashboardPageProps {
  userName: string;
  creditScore: number;
  onApplyLoan: (loanType: string) => void;
}

export function DashboardPage({ userName, creditScore: rawCreditScore, onApplyLoan }: DashboardPageProps) {
  // Ensure creditScore has a valid default
  const creditScore = rawCreditScore || 650;
  
  const [loanRecommendations, setLoanRecommendations] = useState<PersonalizedLoan[]>([]);
  const [allProducts, setAllProducts] = useState<LoanProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true);

  // Mock data for charts - ensure no NaN values
  const safeScore = Number.isFinite(creditScore) ? creditScore : 650;
  const paymentHistory = [
    { month: 'Jan', score: safeScore - 34 },
    { month: 'Feb', score: safeScore - 29 },
    { month: 'Mar', score: safeScore - 22 },
    { month: 'Apr', score: safeScore - 16 },
    { month: 'May', score: safeScore - 9 },
    { month: 'Jun', score: safeScore },
  ];

  // Fetch loan recommendations from API
  useEffect(() => {
    const fetchLoans = async () => {
      if (!creditScore) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to get personalized recommendations (requires auth)
        const recommendations = await api.getLoanRecommendations(undefined, 25000, 36);
        setLoanRecommendations(recommendations.recommendations.slice(0, 3));
        setUseRealData(true);
      } catch (err) {
        // Fallback: get all products and filter by credit score
        try {
          const products = await api.getAllLoanProducts();
          const eligible = products.filter(
            p => creditScore >= p.min_credit_score && creditScore <= p.max_credit_score
          );
          setAllProducts(eligible.slice(0, 3));
          setUseRealData(true);
        } catch (fallbackErr) {
          console.error('Error fetching loans:', fallbackErr);
          setError('Could not load loan products');
          setUseRealData(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [creditScore]);

  // Calculate estimated APR based on credit score
  const getEstimatedApr = (product: LoanProduct): number => {
    const scoreRange = product.max_credit_score - product.min_credit_score;
    const aprRange = product.max_apr - product.min_apr;
    const scorePosition = (creditScore - product.min_credit_score) / scoreRange;
    return product.max_apr - (scorePosition * aprRange);
  };

  // Calculate approval probability based on credit score
  const getApprovalProbability = (product: LoanProduct): number => {
    const scoreMid = (product.min_credit_score + product.max_credit_score) / 2;
    if (creditScore >= product.max_credit_score) return 95;
    if (creditScore >= scoreMid) return 85;
    if (creditScore >= product.min_credit_score) return 70;
    return 50;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render loan cards
  const renderLoanCards = () => {
    if (isLoading) {
      return (
        <div className="col-span-3 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0891B2]" />
          <span className="ml-3 text-[#64748B]">Loading personalized loan offers...</span>
        </div>
      );
    }

    if (error && !useRealData) {
      return (
        <div className="col-span-3 text-center py-8">
          <p className="text-[#64748B] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[#0891B2] hover:underline flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    // Use personalized recommendations if available
    if (loanRecommendations.length > 0) {
      return loanRecommendations.map((rec, index) => (
        <LoanCard
          key={rec.product.product_id}
          loanType={rec.product.product_name}
          lender={rec.product.lender_name}
          amount={`Up to ${formatCurrency(rec.product.max_amount)}`}
          apr={`${rec.estimated_apr.toFixed(2)}% APR`}
          approvalProbability={rec.approval_probability}
          bestMatch={rec.is_best_match}
          preQualified={rec.is_pre_qualified}
          onApply={() => onApplyLoan(rec.product.loan_type)}
        />
      ));
    }

    // Use filtered products
    if (allProducts.length > 0) {
      return allProducts.map((product, index) => {
        const estimatedApr = getEstimatedApr(product);
        const approvalProb = getApprovalProbability(product);
        
        return (
          <LoanCard
            key={product.product_id}
            loanType={product.product_name}
            lender={product.lender_name}
            amount={`Up to ${formatCurrency(product.max_amount)}`}
            apr={`${estimatedApr.toFixed(2)}% APR`}
            approvalProbability={approvalProb}
            bestMatch={index === 0 && approvalProb >= 85}
            preQualified={approvalProb >= 80}
            onApply={() => onApplyLoan(product.loan_type)}
          />
        );
      });
    }

    // Fallback mock data if no real data available
    return (
      <>
        <LoanCard
          loanType="Personal Loan"
          lender="LendingClub"
          amount="Up to $25,000"
          apr="7.9% APR"
          approvalProbability={creditScore >= 720 ? 90 : creditScore >= 680 ? 75 : 60}
          preQualified={creditScore >= 680}
          onApply={() => onApplyLoan('personal')}
        />
        <LoanCard
          loanType="Debt Consolidation"
          lender="Marcus by Goldman Sachs"
          amount="Up to $40,000"
          apr="6.5% APR"
          approvalProbability={creditScore >= 720 ? 92 : creditScore >= 680 ? 78 : 55}
          bestMatch={creditScore >= 720}
          preQualified={creditScore >= 720}
          onApply={() => onApplyLoan('debt_consolidation')}
        />
        <LoanCard
          loanType="Home Improvement"
          lender="SoFi"
          amount="Up to $100,000"
          apr="8.2% APR"
          approvalProbability={creditScore >= 720 ? 85 : creditScore >= 680 ? 70 : 50}
          onApply={() => onApplyLoan('home')}
        />
      </>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[#1A365D]">Welcome back, {userName}!</h2>
        <p className="text-[#64748B]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Credit Score Card - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-[#1A365D] mb-2">Your Credit Score</h3>
                <CreditScoreGauge score={creditScore} />
                <div className="flex items-center gap-2 text-[#10B981] mt-4 justify-center">
                  <TrendingUp className="w-5 h-5" />
                  <span>↑ 12 points since last month</span>
                </div>
                <div className="text-center mt-3">
                  <span className="text-[#64748B] bg-[#0891B2]/10 px-3 py-1 rounded-full inline-flex items-center gap-2">
                    <span className="text-[#0891B2]">⚡</span> Powered by AI
                  </span>
                </div>
              </div>

              {/* Score Trend */}
              <div className="flex-1 w-full">
                <h6 className="text-[#64748B] mb-4">6-Month Trend</h6>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={paymentHistory}>
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" domain={[creditScore - 50, creditScore + 20]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0891B2" 
                      strokeWidth={3}
                      dot={{ fill: '#0891B2', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#0891B2]">
                <CreditCard className="w-5 h-5" />
                <h6 className="text-[#1A365D]">Credit Utilization</h6>
              </div>
              <DonutChart value={35} label="Used" color="#0891B2" />
              <p className="text-[#64748B] text-center">
                $3,500 of $10,000
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Risk Factors Grid */}
      <div className="mb-8">
        <h3 className="text-[#1A365D] mb-6">Credit Health Factors</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<CreditCard className="w-6 h-6" />}
            title="Credit Utilization"
            value="35%"
            trend="Good standing"
            status="good"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Payment History"
            value="98%"
            trend="Excellent"
            status="good"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="Account Age"
            value="4.2 yrs"
            trend="Average"
            status="good"
          />
          <StatCard
            icon={<Search className="w-6 h-6" />}
            title="Recent Inquiries"
            value="2"
            trend="Last 6 months"
            status="warning"
          />
        </div>
      </div>

      {/* Loan Options - Now with Real Data! */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#1A365D]">Recommended Loan Options For You</h3>
            <p className="text-[#64748B]">
              {useRealData ? (
                <>
                  Based on your credit score of <span className="text-[#0891B2] font-semibold">{creditScore}</span> • 
                  <span className="text-[#10B981] ml-1">Real LendingClub rates</span>
                </>
              ) : (
                'Based on your credit profile and financial goals'
              )}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {renderLoanCards()}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What-If Calculator */}
        <Card hoverable>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calculator className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <h5 className="text-[#1A365D] mb-2">What-If Calculator</h5>
              <p className="text-[#64748B] mb-4">
                See how changes to your financial profile could affect your credit score
              </p>
              <button className="text-[#0891B2] hover:underline">
                Try Calculator →
              </button>
            </div>
          </div>
        </Card>

        {/* Tips to Improve */}
        <Card hoverable>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <h5 className="text-[#1A365D] mb-2">AI-Powered Tips</h5>
              <p className="text-[#64748B] mb-4">
                Get personalized recommendations to improve your credit score and unlock better rates
              </p>
              <button className="text-[#0891B2] hover:underline">
                View Tips →
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
