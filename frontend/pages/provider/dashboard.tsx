import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/MainLayout';
import ProviderAnalyticsDashboard from '../../components/ProviderAnalyticsDashboard';
import LoyaltyProgram from '../../components/LoyaltyProgram';

export default function ProviderDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'loyalty' | 'bookings' | 'settings'>('analytics');
  const [providerData, setProviderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProviderData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'provider') {
      router.push('/login');
    }
  };

  const fetchProviderData = async () => {
    try {
      const response = await fetch('/api/providers/my-profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProviderData(data);
      }
    } catch (err) {
      console.error('Failed to fetch provider data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {providerData?.businessName || 'Provider'}!
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'loyalty'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Loyalty Program
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'analytics' && <ProviderAnalyticsDashboard />}

          {activeTab === 'loyalty' && <LoyaltyProgram />}

          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
              <p className="text-gray-600 dark:text-gray-400">Bookings list will be displayed here...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Business Information</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Business Name: {providerData?.businessName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Category: {providerData?.category}
                    </p>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Security</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/provider/2fa-setup')}
                    className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add an extra layer of security
                        </p>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Change Password</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Update your password regularly
                        </p>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
