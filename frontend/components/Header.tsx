import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { authService } from '../lib/auth';

interface HeaderProps {
  user?: any;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Beauty Marketplace</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors">
              Vyhledat služby
            </Link>
            <Link href="/providers" className="text-gray-600 hover:text-primary-600 transition-colors">
              Poskytovatelé
            </Link>
            {user?.role === 'provider' && (
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <UserIcon className="w-5 h-5" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Odhlásit se
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Přihlásit se
                </Link>
                <Link href="/register" className="btn-primary">
                  Registrovat se
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors">
                Vyhledat služby
              </Link>
              <Link href="/providers" className="text-gray-600 hover:text-primary-600 transition-colors">
                Poskytovatelé
              </Link>
              {user?.role === 'provider' && (
                <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="flex flex-col space-y-4">
                    <Link href="/profile" className="text-gray-600 hover:text-primary-600 transition-colors">
                      Profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-left text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      Odhlásit se
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    <Link href="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                      Přihlásit se
                    </Link>
                    <Link href="/register" className="btn-primary text-center">
                      Registrovat se
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

