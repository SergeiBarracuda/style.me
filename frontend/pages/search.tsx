import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, MapPinIcon, FunnelIcon, StarIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';
import { Provider, SearchFilters } from '../types';

const SearchPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Initialize filters from URL params
  useEffect(() => {
    const { q, city, category, minPrice, maxPrice, rating, sortBy } = router.query;
    setFilters({
      query: q as string || '',
      city: city as string || '',
      category: category as string || '',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      sortBy: sortBy as 'rating' | 'price' | 'distance' || 'rating',
    });
  }, [router.query]);

  // Search providers
  useEffect(() => {
    searchProviders();
  }, [filters]);

  const searchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/providers/search?${params.toString()}`);
      setProviders(response.data);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback mock data for demo
      setProviders(mockProviders);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        params.append(k, v.toString());
      }
    });
    router.push(`/search?${params.toString()}`, undefined, { shallow: true });
  };

  const categories = [
    'Všechny kategorie',
    'Kadeřnictví',
    'Kosmetika',
    'Manikúra',
    'Pedikúra',
    'Masáže',
    'Wellness',
  ];

  // Mock data for demo
  const mockProviders: Provider[] = [
    {
      id: '1',
      userId: '1',
      businessName: 'Salon Bella',
      description: 'Moderní kadeřnický salon s dlouholetou tradicí',
      address: 'Václavské náměstí 1',
      city: 'Praha',
      phone: '+420 123 456 789',
      email: 'info@salonbella.cz',
      images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'],
      services: [],
      rating: 4.8,
      reviewCount: 124,
      location: { lat: 50.0755, lng: 14.4378 },
      availability: [],
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      userId: '2',
      businessName: 'Beauty Studio',
      description: 'Kompletní kosmetické služby pro vaši krásu',
      address: 'Náměstí Svobody 5',
      city: 'Brno',
      phone: '+420 987 654 321',
      email: 'info@beautystudio.cz',
      images: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400'],
      services: [],
      rating: 4.9,
      reviewCount: 89,
      location: { lat: 49.1951, lng: 16.6068 },
      availability: [],
      createdAt: '2024-01-01',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-custom py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Co hledáte?"
                  value={filters.query || ''}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Město"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
              >
                <FunnelIcon className="w-5 h-5" />
                <span>Filtry</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input-field"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category === 'Všechny kategorie' ? '' : category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. cena
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max. cena
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Řadit podle
                  </label>
                  <select
                    value={filters.sortBy || 'rating'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input-field"
                  >
                    <option value="rating">Hodnocení</option>
                    <option value="price">Ceny</option>
                    <option value="distance">Vzdálenosti</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Hledám...' : `Nalezeno ${providers.length} poskytovatelů`}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Žádní poskytovatelé nenalezeni
            </h3>
            <p className="text-gray-600">
              Zkuste změnit vyhledávací kritéria nebo filtry
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/provider/${provider.id}`)}
              >
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={provider.images[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'}
                    alt={provider.businessName}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {provider.businessName}
                </h3>
                <p className="text-gray-600 mb-2 line-clamp-2">
                  {provider.description}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {provider.address}, {provider.city}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">{provider.rating}</span>
                    <span className="ml-1 text-gray-600">({provider.reviewCount})</span>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    Zobrazit detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

