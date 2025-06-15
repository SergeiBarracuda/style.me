import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

// Constants
const TOKEN_COOKIE_NAME = 'auth_token';
const TOKEN_EXPIRY_DAYS = 7;

// Types
export type UserRole = 'provider' | 'client';

export interface User {
  id: number;
  email: string;
  userType: UserRole;
  isVerified: boolean;
}

// Helper functions
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Authentication functions
export function setAuthCookie(userId: number, userType: UserRole, token: string) {
  const cookieStore = cookies();
  const expires = new Date();
  expires.setDate(expires.getDate() + TOKEN_EXPIRY_DAYS);
  
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // In a real implementation, this would verify the token with the database
    // For now, we'll use a mock implementation
    // This would be replaced with actual database queries
    
    // Mock implementation for demonstration
    const mockUser: User = {
      id: 1,
      email: 'user@example.com',
      userType: 'client',
      isVerified: true
    };
    
    return mockUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requireAuth(redirectTo: string = '/auth/login') {
  const user = getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export function requireProviderAuth(redirectTo: string = '/auth/login') {
  const user = getCurrentUser();
  if (!user || user.userType !== 'provider') {
    redirect(redirectTo);
  }
  return user;
}

export function requireClientAuth(redirectTo: string = '/auth/login') {
  const user = getCurrentUser();
  if (!user || user.userType !== 'client') {
    redirect(redirectTo);
  }
  return user;
}
