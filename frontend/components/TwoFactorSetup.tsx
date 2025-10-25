'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type TwoFactorSetupProps = {
  onComplete?: () => void;
  onSkip?: () => void;
};

export default function TwoFactorSetup({ onComplete, onSkip }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const initiate2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token: verificationCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      setStep('verify');
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Initial Step */}
      {step === 'initial' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account by enabling two-factor authentication (2FA).
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              What you'll need
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Access to this device to scan a QR code</li>
              <li>A safe place to store backup codes</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={initiate2FA}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Setup Step */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Scan this QR code with your authenticator app, or enter the secret key manually.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {qrCode && (
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>
            )}

            <div className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Secret Key</p>
                  <p className="font-mono text-sm break-all">{secret}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="ml-4 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md text-sm"
                >
                  {copiedSecret ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Backup Codes
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded font-mono text-sm grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-center">{code}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm"
                >
                  {copiedBackupCodes ? 'Copied!' : 'Copy Codes'}
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm"
                >
                  Download Codes
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Verify Setup</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                maxLength={6}
              />
              <button
                onClick={verify2FA}
                disabled={loading || verificationCode.length !== 6}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {error && (
              <div className="mt-3 text-red-500 text-sm">{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === 'verify' && (
        <div className="text-center space-y-4 py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Two-Factor Authentication Enabled!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your account is now protected with an additional layer of security.
          </p>
        </div>
      )}
    </div>
  );
}
