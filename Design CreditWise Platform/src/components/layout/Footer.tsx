import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Shield, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1A365D] text-white mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0891B2] to-[#10B981] rounded-lg flex items-center justify-center">
                <span>CW</span>
              </div>
              <span>CreditWise</span>
            </div>
            <p className="text-gray-300 mb-4">
              AI-powered credit assessment and personalized loan recommendations.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-[#0891B2] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#0891B2] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#0891B2] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#0891B2] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h6 className="mb-4 text-white">Products</h6>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Personal Loans</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Credit Cards</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Auto Loans</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Mortgages</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h6 className="mb-4 text-white">Company</h6>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h6 className="mb-4 text-white">Legal</h6>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Compliance</a></li>
              <li><a href="#" className="hover:text-[#0891B2] transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">
            © 2025 CreditWise. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Bank-level Security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
