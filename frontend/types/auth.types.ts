// Authentication related TypeScript types

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: 'client' | 'provider' | 'admin';
  profileImage?: string;
  phone?: string;
  address?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'client' | 'provider';
}

export interface SocialAuthData {
  provider: 'google' | 'facebook';
  token: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  socialLogin: (userData: SocialAuthData) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}
