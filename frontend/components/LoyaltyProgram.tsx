'use client';

import { useState, useEffect } from 'react';

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

type LoyaltyData = {
  tier: LoyaltyTier;
  points: number;
  totalSpent: number;
  pointsHistory: Array<{
    amount: number;
    reason: string;
    type: 'earned' | 'redeemed';
    createdAt: string;
  }>;
  redeemedRewards: Array<{
    description: string;
    pointsCost: number;
    redeemedAt: string;
  }>;
};

type TierBenefits = {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  pointsMultiplier: number;
  commissionDiscount: number;
  benefits: string[];
  nextTier?: {
    name: string;
    requiredSpending: number;
    requiredPoints: number;
  };
};

const TIER_CONFIG: Record<LoyaltyTier, TierBenefits> = {
  bronze: {
    name: 'Bronze',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    icon: '🥉',
    pointsMultiplier: 1,
    commissionDiscount: 0,
    benefits: ['Earn 1 point per $1', 'Basic support', 'Exclusive offers'],
    nextTier: { name: 'Silver', requiredSpending: 500, requiredPoints: 500 }
  },
  silver: {
    name: 'Silver',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: '🥈',
    pointsMultiplier: 1.25,
    commissionDiscount: 2,
    benefits: ['Earn 1.25 points per $1', '2% commission discount', 'Priority support', 'Early access to new features'],
    nextTier: { name: 'Gold', requiredSpending: 2000, requiredPoints: 2000 }
  },
  gold: {
    name: 'Gold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: '🥇',
    pointsMultiplier: 1.5,
    commissionDiscount: 5,
    benefits: ['Earn 1.5 points per $1', '5% commission discount', 'VIP support', 'Featured provider badge', 'Dedicated account manager'],
    nextTier: { name: 'Platinum', requiredSpending: 10000, requiredPoints: 10000 }
  },
  platinum: {
    name: 'Platinum',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    icon: '💎',
    pointsMultiplier: 2,
    commissionDiscount: 10,
    benefits: ['Earn 2 points per $1', '10% commission discount', 'White-glove support', 'Top featured placement', 'Custom analytics', 'Invitation to exclusive events']
  }
};

export default function LoyaltyProgram() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/loyalty/my-program', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loyalty data');
      }

      const data = await response.json();
      setLoyaltyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    const amount = parseInt(redeemAmount);
    if (!amount || amount <= 0 || amount > (loyaltyData?.points || 0)) {
      setError('Invalid redemption amount');
      return;
    }

    setRedeeming(true);
    setError('');

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          points: amount,
          reason: 'Manual redemption'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to redeem points');
      }

      setShowRedeemModal(false);
      setRedeemAmount('');
      fetchLoyaltyData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !loyaltyData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!loyaltyData) return null;

  const tierConfig = TIER_CONFIG[loyaltyData.tier];
  const progress = tierConfig.nextTier
    ? Math.min(100, (loyaltyData.totalSpent / tierConfig.nextTier.requiredSpending) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Tier Status Card */}
      <div className={`${tierConfig.bgColor} p-6 rounded-lg shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{tierConfig.icon}</span>
            <div>
              <h2 className={`text-3xl font-bold ${tierConfig.color}`}>{tierConfig.name} Member</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {loyaltyData.points.toLocaleString()} points available
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRedeemModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Redeem Points
          </button>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {tierConfig.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Progress to Next Tier */}
        {tierConfig.nextTier && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to {tierConfig.nextTier.name}</span>
              <span className="font-medium">
                ${loyaltyData.totalSpent.toLocaleString()} / ${tierConfig.nextTier.requiredSpending.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Spend ${(tierConfig.nextTier.requiredSpending - loyaltyData.totalSpent).toLocaleString()} more to unlock {tierConfig.nextTier.name} tier
            </p>
          </div>
        )}
      </div>

      {/* Tier Comparison */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Membership Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(Object.keys(TIER_CONFIG) as LoyaltyTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const isCurrentTier = tier === loyaltyData.tier;
            return (
              <div
                key={tier}
                className={`p-4 rounded-lg border-2 ${
                  isCurrentTier
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-center mb-3">
                  <span className="text-3xl">{config.icon}</span>
                  <h4 className={`font-bold text-lg ${config.color}`}>{config.name}</h4>
                  {isCurrentTier && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Current</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{config.pointsMultiplier}x points</p>
                  {config.commissionDiscount > 0 && (
                    <p className="text-green-600">{config.commissionDiscount}% off fees</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points History */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Points History</h3>
        <div className="space-y-3">
          {loyaltyData.pointsHistory.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === 'earned' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {item.type === 'earned' ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium">{item.reason}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={`font-bold ${item.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                {item.type === 'earned' ? '+' : '-'}{item.amount}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Redeem Points</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Available points: <span className="font-bold">{loyaltyData.points}</span>
            </p>
            <p className="text-sm mb-4">100 points = $1 credit</p>

            <input
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder="Enter points to redeem"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              min="0"
              max={loyaltyData.points}
            />

            {redeemAmount && parseInt(redeemAmount) > 0 && (
              <p className="text-sm text-green-600 mb-4">
                Credit value: ${(parseInt(redeemAmount) / 100).toFixed(2)}
              </p>
            )}

            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRedeemPoints}
                disabled={redeeming || !redeemAmount || parseInt(redeemAmount) <= 0}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
              >
                {redeeming ? 'Redeeming...' : 'Redeem'}
              </button>
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedeemAmount('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
