import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GemAd } from '../types';
import AdCard from '../components/AdCard';
import { BadgeCheck, Edit, Save, MapPin, Phone, User, Info, Heart, LayoutGrid } from 'lucide-react';

interface ProfilePageProps {
  navigate: (route: string, params?: any) => void;
  initialTab?: string;
}

const DISTRICTS = [
  'Ratnapura',
  'Beruwala',
  'Elahera',
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna'
];

export default function ProfilePage({ navigate, initialTab = 'profile' }: ProfilePageProps) {
  const { user, userProfile, refreshProfile, loading: authLoading } = useAuth();
  
  // Tabs: 'profile' | 'wishlist'
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(DISTRICTS[0]);
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Wishlist
  const [wishlistAds, setWishlistAds] = useState<GemAd[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('login');
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (userProfile) {
      setName(userProfile.name);
      setPhone(userProfile.phone || '');
      setLocation(userProfile.location || DISTRICTS[0]);
      setBio(userProfile.bio || '');
      setPhotoURL(userProfile.photoURL || '');
    }
  }, [userProfile, user, authLoading]);

  // Load wishlist items
  useEffect(() => {
    const loadWishlist = async () => {
      setWishlistLoading(true);
      const favs = JSON.parse(localStorage.getItem('ratnagem-wishlist') || '[]');
      if (favs.length === 0) {
        setWishlistAds([]);
        setWishlistLoading(false);
        return;
      }

      try {
        // Query active ads and filter where ID in wishlist (safest cross-index method)
        const snap = await getDocs(collection(db, 'ads'));
        const matches: GemAd[] = [];
        snap.forEach((doc) => {
          const ad = doc.data() as GemAd;
          if (favs.includes(ad.id) && ad.status === 'Active') {
            matches.push(ad);
          }
        });
        setWishlistAds(matches);
      } catch (err) {
        console.error('Error loading wishlist details:', err);
      } finally {
        setWishlistLoading(false);
      }
    };

    if (activeTab === 'wishlist') {
      loadWishlist();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim(),
        location: location,
        bio: bio.trim(),
        photoURL: photoURL.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      });

      await refreshProfile();
      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
      alert('Failed to update your trader profile.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Title Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-5">
        <h1 className="text-3xl font-sans font-black tracking-tight text-zinc-900 dark:text-white">
          Trader Profile
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your personal details, contact preferences, and check bookmarked stones.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 focus:outline-none ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          <User className="h-4.5 w-4.5" /> General Info
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 focus:outline-none ${activeTab === 'wishlist' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          <Heart className="h-4.5 w-4.5" /> Saved Wishlist ({wishlistAds.length})
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Block: Photo Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div className="relative inline-block">
              <img
                src={userProfile?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=RG'}
                alt={userProfile?.name}
                className="h-24 w-24 rounded-full mx-auto object-cover border-4 border-blue-500 shadow-md"
              />
              {userProfile?.isVerifiedSeller && (
                <span className="absolute bottom-0 right-1 bg-emerald-500 text-white p-1 rounded-full shadow border-2 border-white" title="Verified Seller Badge">
                  <BadgeCheck className="h-4.5 w-4.5" />
                </span>
              )}
            </div>

            <div>
              <h3 className="font-bold text-lg text-zinc-950 dark:text-white flex items-center justify-center gap-1">
                {userProfile?.name}
                {userProfile?.isVerifiedSeller && (
                  <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded">Verified</span>
                )}
              </h3>
              <p className="text-xs text-gray-500">{userProfile?.email}</p>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400 text-left">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>District: <strong>{userProfile?.location}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>WhatsApp: <strong>{userProfile?.phone || 'Not Registered'}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Block: General Editor */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-sans font-bold text-lg text-zinc-950 dark:text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" /> Account Specifications
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center text-xs font-bold text-blue-500 hover:text-blue-600 gap-1 focus:outline-none"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              {success && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs p-3 rounded-xl">
                  Profile updated successfully!
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                      Display Name or Miner ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  {/* Photo URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                      Profile Photo URL
                    </label>
                    <input
                      type="text"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                        WhatsApp Call / Direct Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                        Trading Location
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                      >
                        {DISTRICTS.map((d, i) => (
                          <option key={i} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                      Trader Bio / Company Description
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none"
                    ></textarea>
                  </div>

                  {/* Edit Controls */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors flex justify-center items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50 dark:border-zinc-850">
                    <span className="text-gray-400 font-medium">Display Name</span>
                    <span className="col-span-2 font-semibold">{userProfile?.name}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50 dark:border-zinc-850">
                    <span className="text-gray-400 font-medium">Registered Email</span>
                    <span className="col-span-2 font-semibold text-gray-500">{userProfile?.email}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50 dark:border-zinc-850">
                    <span className="text-gray-400 font-medium">Trading Location</span>
                    <span className="col-span-2 font-semibold">{userProfile?.location}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50 dark:border-zinc-850">
                    <span className="text-gray-400 font-medium">Contact Phone</span>
                    <span className="col-span-2 font-semibold">{userProfile?.phone || 'Not Specified'}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50 dark:border-zinc-850">
                    <span className="text-gray-400 font-medium">Trader Bio</span>
                    <span className="col-span-2 text-gray-600 dark:text-gray-400 leading-relaxed">{userProfile?.bio || 'No bio entered.'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* WISHLIST SECTION */
        <div className="space-y-6">
          {wishlistLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
              <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
              <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
              <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
            </div>
          ) : wishlistAds.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 space-y-3">
              <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-bold">Your Saved Wishlist is Empty</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Keep track of rare certified diamonds, blue sapphires, or spinels by clicking the heart button on listing cards.
              </p>
              <button
                onClick={() => navigate('ads')}
                className="py-2 px-4 bg-blue-500 hover:bg-blue-600 font-semibold text-white rounded-xl text-xs"
              >
                Start Browsing Gems
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={() => navigate('ad-details', { adId: ad.id })} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
