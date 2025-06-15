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

// Authentication functions - Server side only (placeholder)
// Note: These functions would need to be used in server actions or API routes
export async function setAuthCookie(userId: number, userType: UserRole, token: string) {
  // This would be implemented using server actions or API routes
  // For now, this is a placeholder
  console.warn('setAuthCookie should be implemented in server actions or API routes');
}

export async function clearAuthCookie() {
  // This would be implemented using server actions or API routes
  // For now, this is a placeholder
  console.warn('clearAuthCookie should be implemented in server actions or API routes');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

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

export async function requireAuth(redirectTo: string = '/auth/login') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export async function requireProviderAuth(redirectTo: string = '/auth/login') {
  const user = await getCurrentUser();
  if (!user || user.userType !== 'provider') {
    redirect(redirectTo);
  }
  return user;
}

export async function requireClientAuth(redirectTo: string = '/auth/login') {
  const user = await getCurrentUser();
  if (!user || user.userType !== 'client') {
    redirect(redirectTo);
  }
  return user;
}
