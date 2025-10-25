'use client';

import { useState } from 'react';

type PromotionCodeInputProps = {
  onApply: (code: string, discount: number, finalAmount: number) => void;
  amount: number;
  disabled?: boolean;
};

type PromotionValidation = {
  valid: boolean;
  message?: string;
  discount?: number;
  finalAmount?: number;
  promotionDetails?: {
    type: string;
    description: string;
    validUntil: string;
  };
};

export default function PromotionCodeInput({ onApply, amount, disabled }: PromotionCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<PromotionValidation | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const validateCode = async () => {
    if (!code.trim()) {
      setValidation({ valid: false, message: 'Please enter a promotion code' });
      return;
    }

    setLoading(true);
    setValidation(null);

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          amount
        })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setValidation({
          valid: false,
          message: data.message || 'Invalid or expired promotion code'
        });
        return;
      }

      setValidation({
        valid: true,
        message: 'Promotion code is valid!',
        discount: data.discount,
        finalAmount: data.finalAmount,
        promotionDetails: data.promotionDetails
      });
    } catch (err) {
      setValidation({
        valid: false,
        message: 'Failed to validate promotion code'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (validation?.valid && validation.discount && validation.finalAmount) {
      onApply(code.toUpperCase(), validation.discount, validation.finalAmount);
      setAppliedCode(code.toUpperCase());
    }
  };

  const handleRemove = () => {
    setCode('');
    setValidation(null);
    setAppliedCode(null);
    onApply('', 0, amount); // Reset to original amount
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter promotion code"
            disabled={disabled || !!appliedCode}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 uppercase"
            onKeyPress={(e) => e.key === 'Enter' && validateCode()}
          />
        </div>
        {!appliedCode ? (
          <button
            onClick={validateCode}
            disabled={loading || disabled || !code.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Apply'}
          </button>
        ) : (
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {/* Validation Message */}
      {validation && (
        <div className={`p-3 rounded-md ${
          validation.valid
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {validation.valid ? (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${validation.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {validation.message}
              </p>
              {validation.valid && validation.promotionDetails && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {validation.promotionDetails.description}
                  {validation.promotionDetails.validUntil && (
                    <> • Valid until {new Date(validation.promotionDetails.validUntil).toLocaleDateString()}</>
                  )}
                </p>
              )}
            </div>
          </div>

          {validation.valid && validation.discount && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              <div className="flex justify-between text-sm">
                <span>Original Amount:</span>
                <span className="line-through text-gray-500">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700 dark:text-green-300 mt-1">
                <span>Discount:</span>
                <span>-${validation.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Final Amount:</span>
                <span className="text-green-600">${validation.finalAmount?.toFixed(2)}</span>
              </div>

              {!appliedCode && (
                <button
                  onClick={handleApply}
                  disabled={disabled}
                  className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Apply This Discount
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Applied Code Display */}
      {appliedCode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Promotion code <span className="font-mono">{appliedCode}</span> applied
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
