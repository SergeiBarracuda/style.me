'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentFormProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export default function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    saveCard: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!cardDetails.cardName.trim()) {
      newErrors.cardName = 'Name on card is required';
    }
    
    if (!cardDetails.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!cardDetails.expiry.trim()) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      newErrors.expiry = 'Expiry date must be in MM/YY format';
    }
    
    if (!cardDetails.cvc.trim()) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
      newErrors.cvc = 'CVC must be 3 or 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would make an API call to process the payment
      // For now, we'll simulate a successful payment
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock transaction ID
      const transactionId = `txn_${Date.now()}`;
      
      // Call the success callback with the transaction ID
      onSuccess(transactionId);
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({
        form: 'An error occurred while processing your payment. Please try again.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">Total Amount:</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
        </div>
      </div>
      
      {errors.form && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name on Card
          </label>
          <input
            type="text"
            id="cardName"
            name="cardName"
            value={cardDetails.cardName}
            onChange={handleChange}
            placeholder="John Smith"
            className={`w-full px-3 py-2 border ${
              errors.cardName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
          />
          {errors.cardName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cardName}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Card Number
          </label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={cardDetails.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-3 py-2 border ${
              errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
          />
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cardNumber}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              id="expiry"
              name="expiry"
              value={cardDetails.expiry}
              onChange={handleChange}
              placeholder="MM/YY"
              className={`w-full px-3 py-2 border ${
                errors.expiry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
            />
            {errors.expiry && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiry}</p>
            )}
          </div>
          <div>
            <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CVC
            </label>
            <input
              type="text"
              id="cvc"
              name="cvc"
              value={cardDetails.cvc}
              onChange={handleChange}
              placeholder="123"
              className={`w-full px-3 py-2 border ${
                errors.cvc ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
            />
            {errors.cvc && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cvc}</p>
            )}
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex items-center">
            <input
              id="saveCard"
              name="saveCard"
              type="checkbox"
              checked={cardDetails.saveCard}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Save card for future payments
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
