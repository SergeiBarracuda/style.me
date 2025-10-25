'use client';

import { useState } from 'react';

type ConsentType = 'marketing' | 'analytics' | 'personalization' | 'third_party';

type ConsentStatus = {
  type: ConsentType;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
};

export default function GDPRDataManagement() {
  const [activeSection, setActiveSection] = useState<'consents' | 'export' | 'delete'>('consents');
  const [consents, setConsents] = useState<ConsentStatus[]>([
    { type: 'marketing', granted: false },
    { type: 'analytics', granted: false },
    { type: 'personalization', granted: false },
    { type: 'third_party', granted: false }
  ]);
  const [exportRequested, setExportRequested] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const CONSENT_DESCRIPTIONS: Record<ConsentType, { title: string; description: string }> = {
    marketing: {
      title: 'Marketing Communications',
      description: 'Receive promotional emails, special offers, and marketing materials'
    },
    analytics: {
      title: 'Analytics & Performance',
      description: 'Help us improve our service by allowing anonymous usage analytics'
    },
    personalization: {
      title: 'Personalized Experience',
      description: 'Enable personalized recommendations and customized content'
    },
    third_party: {
      title: 'Third-Party Sharing',
      description: 'Share data with trusted partners to enhance your experience'
    }
  };

  const updateConsent = async (type: ConsentType, granted: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          consentType: type,
          granted
        })
      });

      if (response.ok) {
        setConsents(consents.map(c =>
          c.type === type
            ? { ...c, granted, [granted ? 'grantedAt' : 'revokedAt']: new Date().toISOString() }
            : c
        ));
      }
    } catch (err) {
      console.error('Failed to update consent', err);
    } finally {
      setLoading(false);
    }
  };

  const requestDataExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setExportRequested(true);
        setTimeout(() => {
          // In production, this would download the actual export
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to request export', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Your account deletion request has been processed. You will be logged out.');
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Failed to delete account', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy & Data Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your privacy settings and data in compliance with GDPR
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex gap-6">
          {(['consents', 'export', 'delete'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeSection === section
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {section === 'consents' && 'Consent Management'}
              {section === 'export' && 'Export My Data'}
              {section === 'delete' && 'Delete Account'}
            </button>
          ))}
        </nav>
      </div>

      {/* Consent Management */}
      {activeSection === 'consents' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Your Privacy Matters</p>
                <p>You have full control over your data. You can grant or revoke consent for different types of data processing at any time.</p>
              </div>
            </div>
          </div>

          {consents.map((consent) => {
            const config = CONSENT_DESCRIPTIONS[consent.type];
            return (
              <div
                key={consent.type}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {config.description}
                    </p>
                    {consent.granted && consent.grantedAt && (
                      <p className="text-xs text-green-600">
                        Granted on {new Date(consent.grantedAt).toLocaleDateString()}
                      </p>
                    )}
                    {!consent.granted && consent.revokedAt && (
                      <p className="text-xs text-red-600">
                        Revoked on {new Date(consent.revokedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={consent.granted}
                      onChange={(e) => updateConsent(consent.type, e.target.checked)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Data */}
      {activeSection === 'export' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-4">Export Your Data</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download a complete copy of all your personal data stored in our system.
              This includes your profile information, bookings, messages, payments, and more.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-2">Your export will include:</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>Profile and account information</li>
                <li>All bookings and service history</li>
                <li>Payment records and transactions</li>
                <li>Messages and communications</li>
                <li>Reviews and ratings</li>
                <li>Loyalty points and rewards</li>
                <li>Consent and preference settings</li>
              </ul>
            </div>

            {exportRequested ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">Export initiated! Your download will begin shortly.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={requestDataExport}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
              >
                {loading ? 'Preparing Export...' : 'Export My Data'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Account */}
      {activeSection === 'delete' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-center mb-4">Delete Your Account</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              This action cannot be undone. All your data will be permanently deleted.
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Warning: This will permanently delete:</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-red-700 dark:text-red-300">
                <li>Your account and profile</li>
                <li>All booking history</li>
                <li>Payment records</li>
                <li>Messages and communications</li>
                <li>Reviews and ratings</li>
                <li>Loyalty points and rewards</li>
                <li>All personal data and preferences</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                onClick={deleteAccount}
                disabled={loading || deleteConfirmation !== 'DELETE'}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </button>

              <p className="text-xs text-center text-gray-500">
                By deleting your account, you acknowledge that this action is irreversible and all your data will be permanently removed from our systems within 30 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
