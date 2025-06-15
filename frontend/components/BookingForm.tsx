'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface BookingFormProps {
  providerId: number;
  providerName: string;
  providerPhoto: string;
  services: {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
  }[];
  availableDates: {
    date: string;
    slots: string[];
  }[];
}

export default function BookingForm({
  providerId,
  providerName,
  providerPhoto,
  services,
  availableDates,
}: BookingFormProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Get available times for selected date
  const availableTimesForSelectedDate = selectedDate
    ? availableDates.find(d => d.date === selectedDate)?.slots || []
    : [];

  // Get selected service details
  const serviceDetails = selectedService
    ? services.find(s => s.id === selectedService)
    : null;

  // Calculate total price
  const servicePrice = serviceDetails?.price || 0;
  const platformFee = servicePrice * 0.05; // 5% platform fee
  const totalPrice = servicePrice + platformFee;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      // Move to next step
      setStep(step + 1);
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, this would make an API call to create the booking
      // For now, we'll simulate a successful booking

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to confirmation page
      router.push(`/booking/confirmation?id=${Date.now()}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={providerPhoto || '/placeholder-profile.jpg'}
              alt={providerName}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Book with {providerName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Complete the form below to schedule your appointment
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                1
              </div>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Service</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Date & Time</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                3
              </div>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Payment</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select a Service</h3>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedService === service.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                        : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-500'
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {service.duration} min
                        </p>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${service.price.toFixed(2)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date and Time */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Date and Time</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Dates
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableDates.map((dateObj) => (
                    <button
                      key={dateObj.date}
                      type="button"
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        selectedDate === dateObj.date
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedDate(dateObj.date);
                        setSelectedTime(null);
                      }}
                    >
                      {dateObj.date}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Times for {selectedDate}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableTimesForSelectedDate.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or information the service provider should know..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Details</h3>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Service:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{serviceDetails?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Date:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Time:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{serviceDetails?.duration} minutes</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Service Price:</span>
                      <span className="text-gray-900 dark:text-white font-medium">${servicePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Platform Fee (5%):</span>
                      <span className="text-gray-900 dark:text-white font-medium">${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-2 font-medium">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex items-center">
                    <input
                      id="saveCard"
                      name="saveCard"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Save card for future bookings
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>By completing this booking, you agree to our <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">Terms of Service</Link> and <Link href="/cancellation-policy" className="text-blue-600 hover:underline dark:text-blue-400">Cancellation Policy</Link>.</p>
              </div>
            </div>
          )}          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                form="bookingForm"
                disabled={loading}
                className="ml-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Booking'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};