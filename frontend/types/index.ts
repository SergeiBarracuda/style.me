export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'provider';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  services: Service[];
  rating: number;
  reviewCount: number;
  location: {
    lat: number;
    lng: number;
  };
  availability: Availability[];
  createdAt: string;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
  image?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  client: {
    name: string;
    avatar?: string;
  };
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'rating' | 'price' | 'distance';
}

