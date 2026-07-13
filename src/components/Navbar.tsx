import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gem, MessageSquare, PlusCircle, User as UserIcon, Shield, LogOut, Menu, X, Heart } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
  unreadChatsCount: number;
}

export default function Navbar({ currentRoute, navigate, unreadChatsCount }: NavbarProps) {
  const { userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNav = (route: string, params?: any) => {
    navigate(route, params);
    setMobileMenuOpen(false);
  };

  const activeClass = (route: string) => {
    return currentRoute === route
      ? 'text-blue-500 border-b-2 border-blue-500 font-semibold'
      : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors';
  };

  const handleLogout = async () => {
    await logout();
    navigate('home');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNav('home')}>
            <Gem className="h-8 w-8 text-blue-500 animate-pulse mr-2" />
            <span className="font-sans font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
              Ratna<span className="text-blue-500">Gem</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNav('home')} className={`py-5 text-sm ${activeClass('home')}`}>
              Home
            </button>
            <button onClick={() => handleNav('ads')} className={`py-5 text-sm ${activeClass('ads')}`}>
              Browse Gems
            </button>
            {userProfile && (
              <>
                <button onClick={() => handleNav('my-ads')} className={`py-5 text-sm ${activeClass('my-ads')}`}>
                  My Ads
                </button>
                <button onClick={() => handleNav('chat')} className={`py-5 text-sm flex items-center ${activeClass('chat')}`}>
                  Chat
                  {unreadChatsCount > 0 && (
                    <span className="ml-1.5 flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </>
            )}
            {userProfile?.role === 'admin' && (
              <button onClick={() => handleNav('admin')} className={`py-5 text-sm flex items-center ${activeClass('admin')}`}>
                <Shield className="h-4 w-4 mr-1 text-blue-500" />
                Admin Panel
              </button>
            )}
          </div>

          {/* User Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {userProfile ? (
              <div className="flex items-center space-x-3">
                {/* Post Ad Button */}
                {userProfile.role !== 'admin' && (
                  <button
                    onClick={() => handleNav('post-ad')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all focus:outline-none"
                  >
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Post an Ad
                  </button>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    <img
                      src={userProfile.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=RG'}
                      alt={userProfile.name}
                      className="h-9 w-9 rounded-full object-cover border-2 border-blue-500"
                    />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 z-20 border border-gray-100 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700">
                        <div className="px-4 py-3">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{userProfile.name}</p>
                          {userProfile.isVerifiedSeller && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 mt-1">
                              ✓ Verified Trader
                            </span>
                          )}
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { handleNav('profile'); setDropdownOpen(false); }}
                            className="flex w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            My Profile
                          </button>
                          <button
                            onClick={() => { handleNav('profile', { tab: 'wishlist' }); setDropdownOpen(false); }}
                            className="flex w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            My Saved Wishlist
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-700/50"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNav('login')}
                  className="text-sm font-medium text-zinc-700 dark:text-gray-300 hover:text-blue-500"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Mobile Login/Avatar */}
          <div className="flex items-center md:hidden space-x-2">
            {!userProfile ? (
              <button
                onClick={() => handleNav('login')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Log In
              </button>
            ) : (
              <button
                onClick={() => handleNav('profile')}
                className="p-1 focus:outline-none"
                title="My Profile"
              >
                <img
                  src={userProfile.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=RG'}
                  alt={userProfile.name}
                  className="h-8 w-8 rounded-full object-cover border border-blue-500"
                />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => handleNav('home')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'home' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('ads')}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'ads' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Browse Gems
            </button>
            {userProfile && (
              <>
                <button
                  onClick={() => handleNav('my-ads')}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'my-ads' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  My Ads
                </button>
                <button
                  onClick={() => handleNav('chat')}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'chat' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'} flex items-center justify-between`}
                >
                  <span>Chat</span>
                  {unreadChatsCount > 0 && (
                    <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadChatsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNav('profile')}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'profile' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  My Profile
                </button>
                {userProfile.role !== 'admin' && (
                  <button
                    onClick={() => handleNav('post-ad')}
                    className="block w-full text-center px-3 py-2 mt-4 rounded-md text-white bg-blue-500 font-medium"
                  >
                    + Post an Ad
                  </button>
                )}
              </>
            )}
            {userProfile?.role === 'admin' && (
              <button
                onClick={() => handleNav('admin')}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentRoute === 'admin' ? 'bg-blue-50 dark:bg-zinc-800 text-blue-500' : 'text-gray-600 dark:text-gray-300'} flex items-center`}
              >
                <Shield className="h-4 w-4 mr-1 text-blue-500" />
                Admin Panel
              </button>
            )}
            {!userProfile && (
              <div className="pt-4 pb-2 border-t border-gray-100 dark:border-zinc-800 flex justify-around">
                <button
                  onClick={() => handleNav('login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
          {userProfile && (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img
                    src={userProfile.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=RG'}
                    alt={userProfile.name}
                    className="h-10 w-10 rounded-full"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">{userProfile.name}</div>
                  <div className="text-sm font-medium text-gray-500">{userProfile.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
