import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginPageProps {
  mode: 'login' | 'register';
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, fullName: string) => Promise<void>;
  onSwitchMode: () => void;
  onForgotPassword?: () => void;
  error: string | null;
}

export function LoginPage({ mode, onLogin, onRegister, onSwitchMode, onForgotPassword, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const validateForm = (): boolean => {
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please fill in all required fields');
      return false;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return false;
    }

    if (isRegister && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      if (isRegister) {
        await onRegister(email, password, fullName);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      // Error is handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">CW</span>
          </div>
          <h1 className="text-[#1A365D] text-2xl font-bold">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-[#64748B] mt-2">
            {isRegister 
              ? 'Start your journey to better credit'
              : 'Sign in to access your dashboard'
            }
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {displayError && (
              <div className="bg-[#E11D48]/10 border border-[#E11D48]/20 text-[#E11D48] px-4 py-3 rounded-lg text-sm">
                {displayError}
              </div>
            )}

            {/* Full Name (Register only) */}
            {isRegister && (
              <div className="space-y-2">
                <label className="block text-[#1A365D] font-medium text-sm">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B] focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[#1A365D] font-medium text-sm">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B] focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[#1A365D] font-medium text-sm">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B] focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A365D]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegister && (
                <p className="text-[#64748B] text-xs">Must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <div className="space-y-2">
                <label className="block text-[#1A365D] font-medium text-sm">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-[#1E293B] focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Forgot Password (Login only) */}
            {!isRegister && onForgotPassword && (
              <div className="text-right">
                <button 
                  type="button" 
                  onClick={onForgotPassword}
                  className="text-[#0891B2] hover:underline text-sm"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#64748B]">or</span>
              </div>
            </div>

            {/* Switch Mode */}
            <p className="text-center text-[#64748B]">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-[#0891B2] hover:underline font-medium"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </form>
        </Card>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[#64748B] text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#10B981]" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#10B981]">✓</span>
            <span>FDIC Insured</span>
          </div>
        </div>
      </div>
    </div>
  );
}

