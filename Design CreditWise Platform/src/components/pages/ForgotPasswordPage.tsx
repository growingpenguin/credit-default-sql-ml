/**
 * Forgot Password Page
 * ====================
 * 
 * Allows users to request a password reset link.
 * In demo mode, simulates email sending and shows the reset link directly.
 */

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBack: () => void;
  onResetPassword: (token: string) => void;
}

export function ForgotPasswordPage({ onBack, onResetPassword }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Generate a mock reset token (in production, this would be sent via email)
      const mockToken = btoa(`${email}:${Date.now()}`).slice(0, 32);
      setResetToken(mockToken);
      setIsSubmitted(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE]">
      <Card className="w-full max-w-md p-8">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#0891B2] to-[#1A365D] rounded-2xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Forgot Password?</h1>
              <p className="text-[#64748B]">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <button
              onClick={onBack}
              className="w-full mt-6 flex items-center justify-center gap-2 text-[#64748B] hover:text-[#1A365D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A365D] mb-2">Check Your Email</h2>
              <p className="text-[#64748B] mb-6">
                We've sent a password reset link to:
              </p>
              <p className="font-medium text-[#1A365D] mb-6 p-3 bg-gray-50 rounded-lg">
                {email}
              </p>

              {/* Demo Mode Notice */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-cyan-900 mb-2">🎮 Demo Mode</p>
                <p className="text-sm text-cyan-700 mb-3">
                  In a real app, you'd receive an email. For demo purposes, click below to reset your password:
                </p>
                <Button
                  onClick={() => onResetPassword(resetToken!)}
                  variant="secondary"
                  className="w-full"
                >
                  Reset Password Now
                </Button>
              </div>

              <p className="text-sm text-[#64748B]">
                Didn't receive the email?{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-[#0891B2] hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>

            {/* Back to Login */}
            <button
              onClick={onBack}
              className="w-full mt-6 flex items-center justify-center gap-2 text-[#64748B] hover:text-[#1A365D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;

