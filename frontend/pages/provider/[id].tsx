import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { StarIcon, MapPinIcon, PhoneIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import api from '../../lib/api';
import { Provider, Service, Review } from '../../types';

const ProviderDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    if (id) {
      fetchProviderData();
    }
  }, [id]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      // In real app, these would be separate API calls
      // For demo, using mock data
      const mockProvider: Provider = {
        id: id as string,
        userId: '1',
        businessName: 'Salon Bella',
        description: 'Moderní kadeřnický salon s dlouholetou tradicí. Specializujeme se na střihy, barvení a styling pro všechny typy vlasů.',
        address: 'Václavské náměstí 1',
        city: 'Praha',
        phone: '+420 123 456 789',
        email: 'info@salonbella.cz',
        website: 'www.salonbella.cz',
        images: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800'
        ],
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

      const mockServices: Service[] = [
        {
          id: '1',
          providerId: id as string,
          name: 'Dámský střih',
          description: 'Profesionální střih podle vašich přání',
          duration: 60,
          price: 800,
          category: 'Kadeřnictví',
          image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400'
        },
        {
          id: '2',
          providerId: id as string,
          name: 'Barvení vlasů',
          description: 'Kompletní barvení s profesionální kosmetikou',
          duration: 120,
          price: 1500,
          category: 'Kadeřnictví',
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400'
        },
        {
          id: '3',
          providerId: id as string,
          name: 'Styling',
          description: 'Profesionální styling pro speciální příležitosti',
          duration: 90,
          price: 1200,
          category: 'Kadeřnictví',
          image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400'
        }
      ];

      const mockReviews: Review[] = [
        {
          id: '1',
          bookingId: '1',
          clientId: '1',
          providerId: id as string,
          rating: 5,
          comment: 'Úžasný salon! Paní kadeřnice byla velmi profesionální a výsledek předčil moje očekávání.',
          createdAt: '2024-01-15',
          client: {
            name: 'Anna Nováková',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'
          }
        },
        {
          id: '2',
          bookingId: '2',
          clientId: '2',
          providerId: id as string,
          rating: 4,
          comment: 'Velmi spokojená s barvením. Barva drží dlouho a vlasy jsou zdravé.',
          createdAt: '2024-01-10',
          client: {
            name: 'Marie Svobodová',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
          }
        }
      ];

      setProvider(mockProvider);
      setServices(mockServices);
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (service: Service) => {
    setSelectedService(service);
    router.push(`/booking?providerId=${id}&serviceId=${service.id}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarSolidIcon
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poskytovatel nenalezen</h1>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96">
        <img
          src={provider.images[0]}
          alt={provider.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-custom">
            <h1 className="text-4xl font-bold text-white mb-2">{provider.businessName}</h1>
            <div className="flex items-center text-white mb-4">
              <div className="flex items-center mr-6">
                {renderStars(Math.floor(provider.rating))}
                <span className="ml-2 text-lg font-medium">{provider.rating}</span>
                <span className="ml-1">({provider.reviewCount} hodnocení)</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-1" />
                <span>{provider.address}, {provider.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">O nás</h2>
              <p className="text-gray-600 leading-relaxed">{provider.description}</p>
            </div>

            {/* Services */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Naše služby</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                      <span className="text-lg font-bold text-primary-600">{service.price} Kč</span>
                    </div>
                    <button
                      onClick={() => handleBooking(service)}
                      className="w-full btn-primary"
                    >
                      Rezervovat
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hodnocení zákazníků</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.client.avatar}
                        alt={review.client.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{review.client.name}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('cs-CZ')}
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Info */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontaktní informace</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <a href={`tel:${provider.phone}`} className="text-primary-600 hover:text-primary-700">
                    {provider.phone}
                  </a>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{provider.address}, {provider.city}</span>
                </div>
                {provider.website && (
                  <div className="flex items-center">
                    <span className="w-5 h-5 text-gray-400 mr-3">🌐</span>
                    <a
                      href={`https://${provider.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {provider.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Otevírací doba</h3>
              <div className="space-y-2">
                {['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'].map((day, index) => {
                  const availability = provider.availability.find(a => a.dayOfWeek === index + 1);
                  return (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-600">{day}</span>
                      <span className="text-gray-900">
                        {availability ? `${availability.startTime} - ${availability.endTime}` : 'Zavřeno'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;

