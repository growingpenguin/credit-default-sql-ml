import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Zap, Brain, Shield, Check, Star, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-[#1A365D]">
              Know Your Credit Score in Seconds
            </h1>
            <p className="text-[#64748B] text-xl">
              AI-powered loan recommendations tailored to your financial profile
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={onGetStarted}>
                Check My Eligibility
              </Button>
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-[#64748B]">
                <Shield className="w-5 h-5 text-[#10B981]" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B]">
                <Check className="w-5 h-5 text-[#10B981]" />
                <span>No Credit Impact</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B]">
                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                <span>2M+ Users</span>
              </div>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-2xl p-8 aspect-square flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-2xl">Financial Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[#1A365D] mb-4">Why Choose CreditWise?</h2>
            <p className="text-[#64748B] text-xl">
              Experience the future of credit assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card hoverable>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#0891B2]/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-[#0891B2]" />
                </div>
                <h4 className="text-[#1A365D]">Instant Analysis</h4>
                <p className="text-[#64748B]">
                  Get your credit score and personalized recommendations in seconds using advanced AI algorithms
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card hoverable>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#1A365D]/10 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-[#1A365D]" />
                </div>
                <h4 className="text-[#1A365D]">Smart Recommendations</h4>
                <p className="text-[#64748B]">
                  AI-powered matching finds the best loan options based on your unique financial situation
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card hoverable>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-[#10B981]" />
                </div>
                <h4 className="text-[#1A365D]">Best Rates Guaranteed</h4>
                <p className="text-[#64748B]">
                  We compare rates from multiple lenders to ensure you get the most competitive offers
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-[#1A365D] mb-4">Trusted by Millions</h2>
          <p className="text-[#64748B] text-xl">
            See what our customers are saying
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Johnson',
              role: 'Small Business Owner',
              comment: 'CreditWise helped me understand my credit score and get approved for a business loan with great rates!',
              rating: 5,
            },
            {
              name: 'Michael Chen',
              role: 'Software Engineer',
              comment: 'The AI recommendations were spot-on. I found the perfect personal loan in minutes.',
              rating: 5,
            },
            {
              name: 'Emily Rodriguez',
              role: 'Teacher',
              comment: 'Easy to use and transparent. Finally, a financial service I can trust!',
              rating: 5,
            },
          ].map((testimonial, index) => (
            <Card key={index}>
              <div className="space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-[#64748B]">{testimonial.comment}</p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[#1A365D]">{testimonial.name}</p>
                  <p className="text-[#64748B]">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#1A365D] to-[#0891B2] py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/90 text-xl mb-8">
            Check your credit eligibility in just 2 minutes
          </p>
          <Button size="lg" variant="secondary" onClick={onGetStarted}>
            Check My Eligibility Now
          </Button>
        </div>
      </section>
    </div>
  );
}
