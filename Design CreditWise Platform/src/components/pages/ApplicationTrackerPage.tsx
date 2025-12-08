import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Circle, Upload, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ApplicationTrackerPageProps {
  onBack: () => void;
}

export function ApplicationTrackerPage({ onBack }: ApplicationTrackerPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const steps = [
    { label: 'Application Submitted', completed: true, date: 'Dec 1, 2025' },
    { label: 'Documents Received', completed: true, date: 'Dec 2, 2025' },
    { label: 'Under Review', completed: false, current: true, date: 'Est. Dec 10, 2025' },
    { label: 'Decision', completed: false, current: false, date: 'Est. Dec 12, 2025' },
    { label: 'Funds Disbursed', completed: false, current: false, date: 'Est. Dec 15, 2025' },
  ];

  const faqs = [
    {
      question: 'How long does the review process take?',
      answer: 'Typically, our review process takes 3-5 business days. You\'ll receive email updates at each stage.',
    },
    {
      question: 'What happens if I need to update my application?',
      answer: 'You can contact our support team via chat or email to make changes to your application during the review period.',
    },
    {
      question: 'When will I receive the funds?',
      answer: 'Once approved, funds are typically disbursed within 1-2 business days via direct deposit to your bank account.',
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <button 
        onClick={onBack}
        className="text-[#0891B2] hover:underline mb-6"
      >
        ← Back to Dashboard
      </button>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-[#1A365D] mb-2">Application Status</h2>
          <p className="text-[#64748B]">Reference Number: <span className="text-[#1A365D]">CW-2025-12-001234</span></p>
        </div>

        {/* Status Timeline */}
        <Card>
          <h4 className="text-[#1A365D] mb-6">Application Progress</h4>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${step.completed ? 'bg-[#10B981] text-white' : 
                      step.current ? 'bg-[#0891B2] text-white animate-pulse' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-12 ${step.completed ? 'bg-[#10B981]' : 'bg-gray-200'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <h6 className={`${step.current ? 'text-[#1A365D]' : 'text-[#64748B]'}`}>
                      {step.label}
                    </h6>
                    {step.current && (
                      <span className="text-[#0891B2] bg-[#0891B2]/10 px-3 py-1 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-[#64748B] mt-1">{step.date}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Completion */}
          <div className="mt-6 pt-6 border-t border-gray-200 bg-[#0891B2]/5 -m-6 p-6 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B]">Estimated Completion</p>
                <p className="text-[#1A365D]">December 12, 2025</p>
              </div>
              <div className="text-right">
                <p className="text-[#64748B]">Processing Time</p>
                <p className="text-[#1A365D]">3-5 business days</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Document Upload */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#0891B2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-[#0891B2]" />
            </div>
            <div className="flex-1">
              <h5 className="text-[#1A365D] mb-2">Additional Documents</h5>
              <p className="text-[#64748B] mb-4">
                Need to upload additional documents? You can add them here.
              </p>
              <Button variant="secondary">
                Upload Documents
              </Button>
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-[#10B981]" />
            </div>
            <div className="flex-1">
              <h5 className="text-[#1A365D] mb-2">Need Help?</h5>
              <p className="text-[#64748B] mb-4">
                Our support team is available 24/7 to assist you with your application.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary">
                  Live Chat
                </Button>
                <Button variant="tertiary">
                  Email Support
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card>
          <h5 className="text-[#1A365D] mb-6">Frequently Asked Questions</h5>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[#1A365D] text-left">{faq.question}</span>
                  {faqOpen === index ? (
                    <ChevronUp className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                  )}
                </button>
                {faqOpen === index && (
                  <div className="px-4 pb-4 text-[#64748B]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
