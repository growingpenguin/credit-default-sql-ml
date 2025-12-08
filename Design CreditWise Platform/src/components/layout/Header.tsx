import React, { useState } from 'react';
import { Menu, X, Bell, User, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function Header({ currentPage, onNavigate, isLoggedIn = false, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = isLoggedIn 
    ? ['Dashboard', 'Apply', 'Profile']
    : ['Products', 'About', 'FAQ', 'Contact'];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'landing')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CW</span>
            </div>
            <span className="text-[#1A365D] font-semibold text-lg">CreditWise</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => onNavigate(item.toLowerCase())}
                className={`text-[#64748B] hover:text-[#1A365D] transition-colors ${
                  currentPage === item.toLowerCase() ? 'text-[#1A365D] font-medium' : ''
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-[#64748B]" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#E11D48] rounded-full"></span>
                </button>
                
                {/* User Menu Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5 text-[#64748B]" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[#1E293B] hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={() => {
                          onLogout?.();
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[#E11D48] hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="tertiary" onClick={() => onNavigate('login')}>
                  Login
                </Button>
                <Button onClick={() => onNavigate('register')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#1A365D]" />
            ) : (
              <Menu className="w-6 h-6 text-[#1A365D]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    onNavigate(item.toLowerCase());
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-[#64748B] hover:text-[#1A365D] transition-colors ${
                    currentPage === item.toLowerCase() ? 'text-[#1A365D] font-medium' : ''
                  }`}
                >
                  {item}
                </button>
              ))}
              
              {isLoggedIn ? (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onLogout?.();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-[#E11D48] hover:text-[#BE123C]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="tertiary" onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}>
                    Login
                  </Button>
                  <Button onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
