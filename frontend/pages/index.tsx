import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon, SparklesIcon, ScissorsIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (location) params.append('city', location);
    router.push(`/search?${params.toString()}`);
  };

  const categories = [
    { name: 'Kadeřnictví', icon: ScissorsIcon, count: '150+' },
    { name: 'Kosmetika', icon: SparklesIcon, count: '200+' },
    { name: 'Manikúra', icon: HeartIcon, count: '120+' },
    { name: 'Masáže', icon: UserGroupIcon, count: '80+' },
  ];

  const featuredProviders = [
    {
      id: 1,
      name: 'Salon Bella',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      rating: 4.8,
      reviewCount: 124,
      category: 'Kadeřnictví',
      city: 'Praha',
    },
    {
      id: 2,
      name: 'Beauty Studio',
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
      rating: 4.9,
      reviewCount: 89,
      category: 'Kosmetika',
      city: 'Brno',
    },
    {
      id: 3,
      name: 'Nail Art',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
      rating: 4.7,
      reviewCount: 156,
      category: 'Manikúra',
      city: 'Ostrava',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Najděte nejlepší{' '}
              <span className="text-primary-600">kosmetické služby</span>{' '}
              ve vašem okolí
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Rezervujte si termín u ověřených poskytovatelů. Rychle, jednoduše a spolehlivě.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Co hledáte?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Město"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button type="submit" className="btn-primary py-3">
                  Vyhledat
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Populární kategorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="card text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/search?category=${encodeURIComponent(category.name)}`)}
              >
                <category.icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600">{category.count} poskytovatelů</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Doporučení poskytovatelé
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProviders.map((provider) => (
              <div
                key={provider.id}
                className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/provider/${provider.id}`)}
              >
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{provider.name}</h3>
                <p className="text-gray-600 mb-2">{provider.category} • {provider.city}</p>
                <div className="flex items-center">
                  <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">{provider.rating}</span>
                  <span className="ml-1 text-gray-600">({provider.reviewCount} hodnocení)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Jak to funguje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Vyhledejte</h3>
              <p className="text-gray-600">
                Najděte poskytovatele služeb ve vašem okolí podle kategorie a lokace.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Rezervujte</h3>
              <p className="text-gray-600">
                Vyberte si termín a službu, která vám vyhovuje. Rezervace je rychlá a jednoduchá.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Užijte si</h3>
              <p className="text-gray-600">
                Přijďte na termín a užijte si kvalitní služby od ověřených poskytovatelů.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Jste poskytovatel služeb?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Připojte se k nám a získejte nové klienty
          </p>
          <button
            onClick={() => router.push('/register?role=provider')}
            className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Registrovat se jako poskytovatel
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

