'use client';

import { useState, useEffect } from 'react';

type CancellationRule = {
  timeBeforeAppointment: number; // hours
  penaltyType: 'none' | 'percentage' | 'fixed_amount' | 'full_charge';
  penaltyAmount: number;
  refundPercentage: number;
};

type NoShowPolicy = {
  enabled: boolean;
  gracePeriodMinutes: number;
  penaltyType: 'percentage' | 'fixed_amount' | 'full_charge';
  penaltyAmount: number;
};

type CancellationPolicy = {
  _id: string;
  provider: string;
  policyName: string;
  cancellationRules: CancellationRule[];
  noShowPolicy: NoShowPolicy;
  reschedulePolicy: {
    allowRescheduling: boolean;
    maxReschedulesPerBooking: number;
    minNoticeHours: number;
  };
  freeCancellationWindow: number; // hours
};

type CancellationPreview = {
  canCancel: boolean;
  penalty: number;
  refund: number;
  rule: string;
  message: string;
};

export default function CancellationPolicyDisplay({
  providerId,
  bookingId,
  bookingAmount,
  scheduledDate,
  onCancel
}: {
  providerId: string;
  bookingId?: string;
  bookingAmount?: number;
  scheduledDate?: string;
  onCancel?: () => void;
}) {
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolicy();
  }, [providerId]);

  useEffect(() => {
    if (bookingId && bookingAmount && scheduledDate) {
      fetchCancellationPreview();
    }
  }, [bookingId, bookingAmount, scheduledDate]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cancellation-policies/provider/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPolicy(data.policy);
      }
    } catch (err) {
      console.error('Failed to fetch policy', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCancellationPreview = async () => {
    if (!bookingId) return;

    try {
      const response = await fetch(`/api/cancellation-policies/calculate-penalty/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'preview'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch (err) {
      console.error('Failed to fetch preview', err);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;

    setCancelling(true);
    setError('');

    try {
      const response = await fetch(`/api/cancellation-policies/apply/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel booking');
      }

      const data = await response.json();
      setShowCancelModal(false);
      if (onCancel) onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const formatTimeWindow = (hours: number): string => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getPenaltyDescription = (rule: CancellationRule): string => {
    switch (rule.penaltyType) {
      case 'none':
        return 'Free cancellation';
      case 'percentage':
        return `${rule.penaltyAmount}% cancellation fee`;
      case 'fixed_amount':
        return `$${rule.penaltyAmount} cancellation fee`;
      case 'full_charge':
        return 'Full charge (no refund)';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No cancellation policy available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Cancellation Policy</h3>
        <p className="text-lg font-semibold mb-2">{policy.policyName}</p>

        {/* Free Cancellation Window */}
        {policy.freeCancellationWindow > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">Free Cancellation</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Cancel for free up to {formatTimeWindow(policy.freeCancellationWindow)} before appointment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Rules */}
        <div className="space-y-3">
          <h4 className="font-semibold">Cancellation Fees</h4>
          <div className="space-y-2">
            {policy.cancellationRules
              .sort((a, b) => b.timeBeforeAppointment - a.timeBeforeAppointment)
              .map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">
                      {rule.timeBeforeAppointment > 0
                        ? `More than ${formatTimeWindow(rule.timeBeforeAppointment)} before`
                        : 'Less than the minimum notice'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {getPenaltyDescription(rule)}
                    {rule.refundPercentage > 0 && rule.penaltyType !== 'none' && (
                      <span className="text-green-600 ml-2">
                        ({rule.refundPercentage}% refund)
                      </span>
                    )}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* No-Show Policy */}
        {policy.noShowPolicy.enabled && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">No-Show Policy</h4>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 dark:text-red-200">No-Show Fee</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    If you don't arrive within {policy.noShowPolicy.gracePeriodMinutes} minutes of your appointment,
                    {policy.noShowPolicy.penaltyType === 'full_charge' && ' you will be charged the full amount'}
                    {policy.noShowPolicy.penaltyType === 'percentage' && ` a ${policy.noShowPolicy.penaltyAmount}% fee will be charged`}
                    {policy.noShowPolicy.penaltyType === 'fixed_amount' && ` a $${policy.noShowPolicy.penaltyAmount} fee will be charged`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Policy */}
        {policy.reschedulePolicy.allowRescheduling && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Rescheduling</h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Free Rescheduling</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can reschedule up to {policy.reschedulePolicy.maxReschedulesPerBooking} time{policy.reschedulePolicy.maxReschedulesPerBooking > 1 ? 's' : ''} per booking
                    {policy.reschedulePolicy.minNoticeHours > 0 && (
                      <> with at least {formatTimeWindow(policy.reschedulePolicy.minNoticeHours)} notice</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Preview */}
      {preview && bookingAmount && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Cancellation Preview</h3>
          <div className={`p-4 rounded-lg mb-4 ${
            preview.canCancel
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`font-medium ${preview.canCancel ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'}`}>
              {preview.message}
            </p>
          </div>

          {preview.canCancel && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Booking Amount:</span>
                <span className="font-medium">${bookingAmount.toFixed(2)}</span>
              </div>
              {preview.penalty > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Cancellation Fee:</span>
                  <span className="font-medium">-${preview.penalty.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Refund Amount:</span>
                <span className="text-green-600">${preview.refund.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {preview.rule}
              </p>

              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Cancellation</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Cancellation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {preview && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Cancellation Fee:</span>
                    <span className="font-medium text-red-600">${preview.penalty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Refund:</span>
                    <span className="text-green-600">${preview.refund.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
