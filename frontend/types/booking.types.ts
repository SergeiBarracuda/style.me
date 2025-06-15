export interface Booking {
  _id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  dateTime: string;
  duration: number;
  price: number;
  status: BookingStatus;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface BookingData {
  providerId: string;
  serviceId: string;
  dateTime: string;
  duration: number;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
}

export interface BookingContextType {
  clientBookings: Booking[];
  providerBookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  createBooking: (bookingData: BookingData) => Promise<Booking>;
  getBookingById: (bookingId: string) => Promise<Booking>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<Booking>;
  cancelBooking: (bookingId: string, cancellationReason?: string) => Promise<Booking>;
  rescheduleBooking: (bookingId: string, dateTime: string) => Promise<Booking>;
  loadClientBookings: () => Promise<void>;
  loadProviderBookings: () => Promise<void>;
}

export interface BookingError {
  message: string;
  status?: number;
}
