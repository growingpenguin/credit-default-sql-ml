import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Lock, Bell, Link as LinkIcon, Shield, Download, Trash2 } from 'lucide-react';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  onBack: () => void;
}

export function ProfilePage({ userName, userEmail, onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <button 
        onClick={onBack}
        className="text-[#0891B2] hover:underline mb-6"
      >
        ← Back to Dashboard
      </button>

      <h2 className="text-[#1A365D] mb-8">Account Settings</h2>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${activeTab === tab.id 
                        ? 'bg-[#0891B2] text-white' 
                        : 'text-[#64748B] hover:bg-gray-100'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h4 className="text-[#1A365D] mb-6">Personal Information</h4>
              
              {/* Profile Photo */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1A365D] to-[#0891B2] rounded-full flex items-center justify-center text-white text-2xl">
                  {userName.charAt(0)}
                </div>
                <div>
                  <h6 className="text-[#1A365D] mb-2">Profile Photo</h6>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Change Photo
                    </Button>
                    <Button variant="tertiary" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    defaultValue={userName}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    defaultValue={userEmail}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                  />
                </div>

                <Input
                  label="Address"
                  placeholder="123 Main Street"
                />

                <div className="grid md:grid-cols-3 gap-6">
                  <Input
                    label="City"
                    placeholder="New York"
                  />
                  <Input
                    label="State"
                    placeholder="NY"
                  />
                  <Input
                    label="ZIP Code"
                    placeholder="10001"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="secondary">
                    Cancel
                  </Button>
                  <Button>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <h4 className="text-[#1A365D] mb-6">Change Password</h4>
                <div className="space-y-6">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </div>
              </Card>

              <Card>
                <h4 className="text-[#1A365D] mb-6">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="text-[#1A365D] mb-1">Enable 2FA</h6>
                    <p className="text-[#64748B]">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0891B2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0891B2]"></div>
                  </label>
                </div>
              </Card>

              <Card>
                <h4 className="text-[#1A365D] mb-6">Active Sessions</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h6 className="text-[#1A365D]">MacBook Pro - Chrome</h6>
                      <p className="text-[#64748B]">New York, US • Current Session</p>
                    </div>
                    <span className="text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h6 className="text-[#1A365D]">iPhone 14 - Safari</h6>
                      <p className="text-[#64748B]">New York, US • Last active 2 hours ago</p>
                    </div>
                    <Button variant="tertiary" size="sm">Revoke</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h4 className="text-[#1A365D] mb-6">Notification Preferences</h4>
              <div className="space-y-6">
                {[
                  { title: 'Email Notifications', desc: 'Receive email updates about your applications' },
                  { title: 'SMS Notifications', desc: 'Get text messages for important updates' },
                  { title: 'Application Updates', desc: 'Notifications when your application status changes' },
                  { title: 'Promotional Offers', desc: 'Receive special offers and new product announcements' },
                  { title: 'Credit Score Updates', desc: 'Get notified when your credit score changes' },
                ].map((notification, index) => (
                  <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <h6 className="text-[#1A365D] mb-1">{notification.title}</h6>
                      <p className="text-[#64748B]">{notification.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={index < 3} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0891B2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0891B2]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <h4 className="text-[#1A365D] mb-6">Data Privacy</h4>
                <div className="space-y-6">
                  <div>
                    <h6 className="text-[#1A365D] mb-2">Connected Accounts</h6>
                    <p className="text-[#64748B] mb-4">
                      Manage third-party services connected to your account
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="w-5 h-5 text-[#0891B2]" />
                          <span className="text-[#1A365D]">Bank Account - Wells Fargo</span>
                        </div>
                        <Button variant="tertiary" size="sm">Disconnect</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h6 className="text-[#1A365D] mb-2">Download Your Data</h6>
                    <p className="text-[#64748B] mb-4">
                      Get a copy of all your data stored in CreditWise
                    </p>
                    <Button variant="secondary">
                      <Download className="w-4 h-4" />
                      Download Data
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border-2 border-[#E11D48]/20">
                <h4 className="text-[#E11D48] mb-6">Danger Zone</h4>
                <div>
                  <h6 className="text-[#1A365D] mb-2">Delete Account</h6>
                  <p className="text-[#64748B] mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="danger">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
