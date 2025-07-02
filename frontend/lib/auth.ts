import api from './api';
import Cookies from 'js-cookie';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    Cookies.set('auth_token', token, { expires: 7 });
    return { token, user };
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'provider';
    phone?: string;
  }) {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;
    
    Cookies.set('auth_token', token, { expires: 7 });
    return { token, user };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    Cookies.remove('auth_token');
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('auth_token');
  },

  getToken(): string | undefined {
    return Cookies.get('auth_token');
  }
};

