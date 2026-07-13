import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GemAd, UserProfile } from '../types';
import ImageGallery from '../components/ImageGallery';
import ReportAdDialog from '../components/ReportAdDialog';
import { DetailsSkeleton } from '../components/Skeleton';
import {
  MapPin,
  Sparkles,
  Phone,
  MessageSquare,
  Bookmark,
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  Calendar,
  Weight,
  Layers,
  Scale
} from 'lucide-react';

interface AdDetailsPageProps {
  adId: string;
  navigate: (route: string, params?: any) => void;
}

export default function AdDetailsPage({ adId, navigate }: AdDetailsPageProps) {
  const { user, userProfile } = useAuth();
  const [ad, setAd] = useState<GemAd | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);

  useEffect(() => {
    const fetchAdAndSeller = async () => {
      try {
        const adRef = doc(db, 'ads', adId);
        const adSnap = await getDoc(adRef);
        
        if (adSnap.exists()) {
          const adData = adSnap.data() as GemAd;
          setAd(adData);

          // Load seller profile only if user is signed in
          if (user) {
            const sellerSnap = await getDoc(doc(db, 'users', adData.sellerId));
            if (sellerSnap.exists()) {
              setSeller(sellerSnap.data() as UserProfile);
            }
          } else {
            setSeller({
              uid: adData.sellerId,
              name: 'Registered Gem Trader',
              location: adData.location || 'Ratnapura',
              isVerifiedSeller: false,
              isBlocked: false,
              role: 'user',
              createdAt: '',
              email: '',
              bio: 'Sign in to view this seller\'s profile details and contact information.'
            });
          }
        }
      } catch (err) {
        console.error('Error fetching ad detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdAndSeller();

    // Check wishlist status
    const favs = JSON.parse(localStorage.getItem('ratnagem-wishlist') || '[]');
    setIsFavorited(favs.includes(adId));
  }, [adId, user]);

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('ratnagem-wishlist') || '[]');
    let updated = [];
    if (favs.includes(adId)) {
      updated = favs.filter((id: string) => id !== adId);
      setIsFavorited(false);
    } else {
      updated = [...favs, adId];
      setIsFavorited(true);
    }
    localStorage.setItem('ratnagem-wishlist', JSON.stringify(updated));
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('login');
      return;
    }
    if (!ad) return;

    if (user.uid === ad.sellerId) {
      alert("You cannot start a chat on your own listing!");
      return;
    }

    setChatStarting(true);

    try {
      // 1. Check if a chat room already exists using the predictable doc ID
      const chatId = `${ad.id}_${user.uid}`;
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      
      if (chatSnap.exists()) {
        // Chat room exists, navigate to it
        navigate('chat', { chatId });
        return;
      }

      // 2. Otherwise, create a new chat room document
      const newChatId = chatId;
      const newChatRoom = {
        id: newChatId,
        adId: ad.id,
        adTitle: ad.title,
        adPrice: ad.price,
        adImage: ad.images[0] || '',
        buyerId: user.uid,
        sellerId: ad.sellerId,
        participants: [user.uid, ad.sellerId],
        lastMessage: 'Chat started by buyer.',
        lastMessageAt: new Date().toISOString(),
        unreadBuyer: false,
        unreadSeller: true
      };

      await setDoc(doc(db, 'chats', newChatId), newChatRoom);
      navigate('chat', { chatId: newChatId });

    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to initiate secure chat connection.');
    } finally {
      setChatStarting(false);
    }
  };

  if (loading) return <DetailsSkeleton />;

  if (!ad) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ad Listing Not Found</h2>
        <p className="text-sm text-gray-500">The listing you are searching for might have been deleted, sold, or expired.</p>
        <button onClick={() => navigate('home')} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-semibold rounded-xl text-sm text-white">
          Back to Home
        </button>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  }).format(ad.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Breadcrumb / Back button */}
      <button
        onClick={() => navigate('ads')}
        className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-zinc-900 dark:hover:text-white gap-1 focus:outline-none"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Col: Image Gallery & Description */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={ad.images} title={ad.title} />

          {/* Core Specs bento box */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1 text-center sm:text-left border-r border-gray-200 dark:border-zinc-800 last:border-none pr-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Weight className="h-3.5 w-3.5 text-blue-500" /> Weight
              </span>
              <p className="text-sm font-black text-zinc-950 dark:text-white">{ad.weight.toFixed(2)} Carats</p>
            </div>
            
            <div className="space-y-1 text-center sm:text-left border-r border-gray-200 dark:border-zinc-800 last:border-none pr-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Layers className="h-3.5 w-3.5 text-blue-500" /> Treatment
              </span>
              <p className="text-sm font-black text-zinc-950 dark:text-white">{ad.treatment}</p>
            </div>

            <div className="space-y-1 text-center sm:text-left border-r border-gray-200 dark:border-zinc-800 last:border-none pr-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Scale className="h-3.5 w-3.5 text-blue-500" /> Color
              </span>
              <p className="text-sm font-black text-zinc-950 dark:text-white">{ad.color}</p>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Cut / Shape
              </span>
              <p className="text-sm font-black text-zinc-950 dark:text-white">{ad.shape}</p>
            </div>
          </div>

          {/* Gemstone Description */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-lg text-zinc-900 dark:text-white">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {ad.description || 'No detailed gemstone description provided.'}
            </p>
          </div>

          {/* Full Specifications list */}
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-lg text-zinc-900 dark:text-white">Full Certificate Specifications</h3>
            <div className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden text-sm divide-y divide-gray-100 dark:divide-zinc-800">
              <div className="flex px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/10">
                <span className="w-1/3 text-gray-400 font-medium">Gem Category</span>
                <span className="w-2/3 font-semibold text-zinc-900 dark:text-white">{ad.category}</span>
              </div>
              <div className="flex px-4 py-3">
                <span className="w-1/3 text-gray-400 font-medium">Geographical Origin</span>
                <span className="w-2/3 font-semibold text-zinc-900 dark:text-white">{ad.origin || 'Not Specified (Uncertified)'}</span>
              </div>
              <div className="flex px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/10">
                <span className="w-1/3 text-gray-400 font-medium">Treatment Status</span>
                <span className="w-2/3 font-semibold text-zinc-900 dark:text-white">{ad.treatment}</span>
              </div>
              <div className="flex px-4 py-3">
                <span className="w-1/3 text-gray-400 font-medium">Cut / Cut Type</span>
                <span className="w-2/3 font-semibold text-zinc-900 dark:text-white">{ad.shape}</span>
              </div>
              <div className="flex px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/10">
                <span className="w-1/3 text-gray-400 font-medium">Post Date</span>
                <span className="w-2/3 font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(ad.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Price, Contact preferences, Seller Info */}
        <div className="space-y-6">
          {/* Main Price Box */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Direct Trading Price</span>
              <div className="font-sans font-black text-3xl text-zinc-950 dark:text-white">
                {formattedPrice}
              </div>
              {ad.isNegotiable ? (
                <span className="inline-flex items-center text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded">
                  Price Negotiable
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded">
                  Fixed Price
                </span>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={toggleFavorite}
                className={`flex-grow-0 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${isFavorited ? 'text-red-500 border-red-200 bg-red-50/30' : 'text-gray-400'}`}
                title="Save to Wishlist"
              >
                <Bookmark className={`h-5 w-5 ${isFavorited ? 'fill-red-500' : ''}`} />
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:text-red-500 hover:border-red-200 hover:bg-red-50/30 transition-colors text-gray-400"
                title="Report Flag"
              >
                <AlertTriangle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Contact Actions Box */}
          {user?.uid !== ad.sellerId && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-zinc-400">Trade Connections</h4>
              
              {/* In-app Chat Button */}
              {(ad.contactPreference === 'chat' || ad.contactPreference === 'both') && (
                <button
                  onClick={handleStartChat}
                  disabled={chatStarting}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 flex justify-center items-center gap-2"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  {chatStarting ? 'Initiating...' : 'Contact via In-app Chat'}
                </button>
              )}

              {/* Reveal Phone Button */}
              {(ad.contactPreference === 'phone' || ad.contactPreference === 'both') && (
                <div className="space-y-2">
                  {phoneRevealed ? (
                    <a
                      href={`tel:${seller?.phone || ad.sellerId}`}
                      className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 border border-zinc-800"
                    >
                      <Phone className="h-4.5 w-4.5 text-blue-500" />
                      {seller?.phone || 'No Phone Registered'}
                    </a>
                  ) : (
                    <button
                      onClick={() => setPhoneRevealed(true)}
                      className="w-full py-3 px-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-white font-semibold rounded-xl text-sm border border-gray-100 dark:border-zinc-700 flex justify-center items-center gap-2"
                    >
                      <Phone className="h-4.5 w-4.5 text-blue-500" />
                      Reveal Seller Phone
                    </button>
                  )}
                  {phoneRevealed && seller?.phone && (
                    <a
                      href={`https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs text-emerald-500 font-semibold hover:underline"
                    >
                      Open in WhatsApp Direct
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seller Profile Box */}
          {seller && (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={seller.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=Seller'}
                  alt={seller.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1">
                    {seller.name}
                    {seller.isVerifiedSeller && (
                      <BadgeCheck className="h-4 w-4 text-emerald-500" title="Verified Seller" />
                    )}
                  </h4>
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" /> {seller.location}
                  </p>
                </div>
              </div>
              {seller.bio && (
                <p className="text-xs text-gray-500 italic leading-relaxed border-t border-gray-200 dark:border-zinc-800 pt-3">
                  "{seller.bio}"
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Flag Report Dialog */}
      <ReportAdDialog
        adId={ad.id}
        adTitle={ad.title}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />

    </div>
  );
}
