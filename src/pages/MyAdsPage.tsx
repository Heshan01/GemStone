import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GemAd } from '../types';
import { Edit3, CheckCircle2, Trash2, Eye, ShieldAlert, Sparkles, MessageSquare, ListCollapse } from 'lucide-react';

interface MyAdsPageProps {
  navigate: (route: string, params?: any) => void;
}

export default function MyAdsPage({ navigate }: MyAdsPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<GemAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'All' | 'Active' | 'Pending' | 'Sold' | 'Rejected'>('All');

  // Iframe-safe Custom Confirmation Modal States
  const [confirmAction, setConfirmAction] = useState<{
    type: 'sold' | 'delete';
    adId: string;
    adTitle: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchMyAds = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const adsRef = collection(db, 'ads');
      const q = query(adsRef, where('sellerId', '==', user.uid));
      const snap = await getDocs(q);
      const list: GemAd[] = [];
      snap.forEach((doc) => list.push(doc.data() as GemAd));
      // Sort client-side to avoid requiring composite index
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAds(list);
    } catch (err) {
      console.error('Error fetching seller ads:', err);
      setError('Could not retrieve your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('login');
      return;
    }
    fetchMyAds();
  }, [user, authLoading]);

  const executeMarkAsSold = async (adId: string) => {
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const docRef = doc(db, 'ads', adId);
      await updateDoc(docRef, { status: 'Sold', updatedAt: new Date().toISOString() });
      setActionSuccessMessage('Gemstone listing has been successfully marked as Sold!');
      await fetchMyAds();
    } catch (err) {
      console.error('Error marking ad as sold:', err);
      setActionError('Failed to update listing status. Security rules might have restricted the update.');
      try {
        handleFirestoreError(err, OperationType.UPDATE, `ads/${adId}`);
      } catch (logErr) {
        // Logging of error handled
      }
    }
  };

  const executeDeleteAd = async (adId: string) => {
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      const docRef = doc(db, 'ads', adId);
      await deleteDoc(docRef);
      setActionSuccessMessage('Gemstone listing has been successfully deleted.');
      await fetchMyAds();
    } catch (err) {
      console.error('Error deleting ad:', err);
      setActionError('Failed to delete listing. Security rules might have restricted the deletion.');
      try {
        handleFirestoreError(err, OperationType.DELETE, `ads/${adId}`);
      } catch (logErr) {
        // Logging of error handled
      }
    }
  };

  const getStatusBadgeColor = (status: GemAd['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40';
      case 'Pending Approval':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40';
      case 'Sold':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/40 font-semibold';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40';
      case 'Suspended':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-bold';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-850 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800';
    }
  };

  const counts = {
    All: ads.length,
    Active: ads.filter(ad => ad.status === 'Active').length,
    Pending: ads.filter(ad => ad.status === 'Pending Approval').length,
    Sold: ads.filter(ad => ad.status === 'Sold').length,
    Rejected: ads.filter(ad => ad.status === 'Rejected').length,
  };

  const filteredAds = ads.filter(ad => {
    if (selectedTab === 'All') return true;
    if (selectedTab === 'Pending') return ad.status === 'Pending Approval';
    return ad.status === selectedTab;
  });

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
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-tight text-zinc-900 dark:text-white">
            My Ads Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your gem listings, view approval status, or update active posts.
          </p>
        </div>
        <button
          onClick={() => navigate('post-ad')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 font-bold rounded-xl text-sm text-white"
        >
          + Post New Ad
        </button>
      </div>

      {actionError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl text-red-700 dark:text-red-400 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">Dismiss</button>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span>{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !error && ads.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          {(['All', 'Active', 'Pending', 'Sold', 'Rejected'] as const).map((tab) => {
            const isActive = selectedTab === tab;
            const count = counts[tab];
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/10'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-gray-200/60 text-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-400'
                }`}
              >
                <span>{tab === 'Pending' ? 'Pending Approval' : tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-200/60 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
          <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
          <div className="h-44 bg-gray-150 dark:bg-zinc-900 rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 space-y-4">
          <ListCollapse className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold">You haven't posted any ads yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Ready to showcase your gemstones to global buyers? Click below to fill out the posting form.
          </p>
          <button
            onClick={() => navigate('post-ad')}
            className="py-2.5 px-5 bg-blue-500 hover:bg-blue-600 font-bold text-white rounded-xl text-xs"
          >
            Post Your First Ad
          </button>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 space-y-3">
          <ListCollapse className="h-10 w-10 text-gray-400 dark:text-zinc-500 mx-auto" />
          <h3 className="text-lg font-bold">No {selectedTab === 'Pending' ? 'Pending Approval' : selectedTab} ads found</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            You don't have any listings in this status right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Highlight Featured */}
              {ad.isFeatured && (
                <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg flex items-center">
                  <Sparkles className="h-3 w-3 mr-0.5" /> Promoted
                </div>
              )}

              {/* Top Row: Preview & Title */}
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-950 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800">
                  <img
                    src={ad.images[0] || 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop'}
                    alt={ad.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 overflow-hidden">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeColor(ad.status)}`}>
                    {ad.status}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={ad.title}>
                    {ad.title}
                  </h3>
                  <p className="text-xs text-blue-500 font-bold">
                    {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(ad.price)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {ad.weight} Cts · {ad.category} · {ad.location}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Control Buttons */}
              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                <button
                  onClick={() => navigate('ad-details', { adId: ad.id })}
                  className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex justify-center items-center gap-1 border border-gray-100 dark:border-zinc-800"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>

                {ad.status !== 'Sold' && ad.status !== 'Rejected' && (
                  <>
                    <button
                      onClick={() => navigate('post-ad', { editAdId: ad.id })}
                      className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex justify-center items-center gap-1 border border-gray-100 dark:border-zinc-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'sold', adId: ad.id, adTitle: ad.title })}
                      className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex justify-center items-center gap-1 border border-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sold
                    </button>
                  </>
                )}

                <button
                  onClick={() => setConfirmAction({ type: 'delete', adId: ad.id, adTitle: ad.title })}
                  className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-xs font-bold flex justify-center items-center border border-red-500/20"
                  title="Delete Listing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable Custom Modal (Iframe-safe Confirm Dialog) */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  confirmAction.type === 'delete' 
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' 
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                }`}>
                  {confirmAction.type === 'delete' ? (
                    <Trash2 className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {confirmAction.type === 'delete' ? 'Delete Listing?' : 'Mark Gem as Sold?'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {confirmAction.type === 'delete' ? 'This action is irreversible.' : 'This listing will be marked as Sold.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-850">
                <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider mb-1">Gemstone Listing</span>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block truncate">{confirmAction.adTitle}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { type, adId } = confirmAction;
                    setConfirmAction(null);
                    if (type === 'sold') {
                      await executeMarkAsSold(adId);
                    } else if (type === 'delete') {
                      await executeDeleteAd(adId);
                    }
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-white transition-colors ${
                    confirmAction.type === 'delete'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
