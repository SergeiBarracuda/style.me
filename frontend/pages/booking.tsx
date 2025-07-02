import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CalendarIcon, ClockIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { Provider, Service, User } from '../types';

interface BookingPageProps {
  user: User | null;
}

const BookingPage: React.FC<BookingPageProps> = ({ user }) => {
  const router = useRouter();
  const { providerId, serviceId } = router.query;
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Confirmation, 3: Payment, 4: Success
  const [bookingData, setBookingData] = useState({
    notes: '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (providerId && serviceId) {
      fetchBookingData();
    }
  }, [providerId, serviceId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      // Mock data for demo
      const mockProvider: Provider = {
        id: providerId as string,
        userId: '1',
        businessName: 'Salon Bella',
        description: 'Moderní kadeřnický salon',
        address: 'Václavské náměstí 1',
        city: 'Praha',
        phone: '+420 123 456 789',
        email: 'info@salonbella.cz',
        images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'],
        services: [],
        rating: 4.8,
        reviewCount: 124,
        location: { lat: 50.0755, lng: 14.4378 },
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
        ],
        createdAt: '2024-01-01',
      };

      const mockService: Service = {
        id: serviceId as string,
        providerId: providerId as string,
        name: 'Dámský střih',
        description: 'Profesionální střih podle vašich přání',
        duration: 60,
        price: 800,
        category: 'Kadeřnictví',
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400'
      };

      setProvider(mockProvider);
      setService(mockService);
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      // Mock available time slots
      const slots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00'
      ];
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    try {
      setBooking(true);
      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setStep(4);
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setBooking(false);
    }
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
      
      // Check if provider is available on this day
      const isAvailable = provider?.availability.some(a => a.dayOfWeek === dayOfWeek);
      
      if (isAvailable) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('cs-CZ', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })
        });
      }
    }
    
    return dates.slice(0, 7); // Show next 7 available dates
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!provider || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Služba nenalezena</h1>
          <button
            onClick={() => router.push('/search')}
            className="btn-primary"
          >
            Zpět na vyhledávání
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="card text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rezervace potvrzena!</h1>
            <p className="text-gray-600 mb-6">
              Vaše rezervace byla úspěšně vytvořena. Potvrzení jsme vám zaslali na email.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Detaily rezervace:</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Služba:</strong> {service.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Poskytovatel:</strong> {provider.businessName}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Datum:</strong> {new Date(selectedDate).toLocaleDateString('cs-CZ')}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Čas:</strong> {selectedTime}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Cena:</strong> {service.price} Kč
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/profile/bookings')}
                className="w-full btn-primary"
              >
                Zobrazit moje rezervace
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full btn-secondary"
              >
                Zpět na hlavní stránku
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <div className="text-sm text-gray-600">
                {step === 1 && 'Vyberte datum a čas'}
                {step === 2 && 'Potvrzení rezervace'}
                {step === 3 && 'Platba'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Vyberte datum a čas</h2>
                  
                  {/* Date Selection */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dostupné termíny</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getNextAvailableDates().map((dateOption) => (
                        <button
                          key={dateOption.date}
                          onClick={() => setSelectedDate(dateOption.date)}
                          className={`p-3 text-center border rounded-lg transition-colors ${
                            selectedDate === dateOption.date
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-sm font-medium">{dateOption.display}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dostupné časy</h3>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2 text-center border rounded-lg transition-colors ${
                              selectedTime === time
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poznámky (volitelné)
                    </label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                      rows={3}
                      className="input-field"
                      placeholder="Máte nějaké speciální požadavky?"
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pokračovat
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Potvrzení rezervace</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Shrnutí rezervace</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Služba:</span>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Datum:</span>
                        <span className="font-medium">
                          {new Date(selectedDate).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Čas:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Doba trvání:</span>
                        <span className="font-medium">{service.duration} minut</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-900 font-semibold">Celková cena:</span>
                        <span className="text-lg font-bold text-primary-600">{service.price} Kč</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Kontaktní údaje</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={bookingData.phone}
                          onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={bookingData.email}
                          onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setStep(1)}
                      className="btn-secondary flex-1"
                    >
                      Zpět
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!bookingData.phone || !bookingData.email}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pokračovat k platbě
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Platba</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <CreditCardIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Demo režim</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Toto je demo aplikace. Skutečná platba nebude provedena.
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Způsob platby</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="payment" value="card" defaultChecked className="mr-3" />
                        <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span>Platební karta</span>
                      </label>
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="payment" value="cash" className="mr-3" />
                        <span className="w-5 h-5 text-gray-400 mr-3">💰</span>
                        <span>Hotově na místě</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-secondary flex-1"
                    >
                      Zpět
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={booking}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {booking ? 'Zpracovávám...' : 'Potvrdit rezervaci'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shrnutí objednávky</h3>
                
                <div className="flex items-start space-x-3 mb-4">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">{provider.businessName}</p>
                    <p className="text-sm text-gray-500">{service.duration} minut</p>
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(selectedDate).toLocaleDateString('cs-CZ')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      {selectedTime}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Celkem:</span>
                    <span className="text-xl font-bold text-primary-600">{service.price} Kč</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

