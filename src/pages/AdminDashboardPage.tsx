import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  addDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GemAd, UserProfile, SiteAnnouncement, GemCategory, ReportAd } from '../types';
import {
  Shield,
  ShieldAlert,
  Users,
  Megaphone,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Gem,
  CheckCircle,
  Bookmark,
  Sparkles,
  BarChart3,
  Calendar,
  Lock
} from 'lucide-react';

interface AdminDashboardPageProps {
  navigate: (route: string, params?: any) => void;
}

export default function AdminDashboardPage({ navigate }: AdminDashboardPageProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  
  // Tabs: 'overview' | 'approvals' | 'users' | 'announcements' | 'categories' | 'reports'
  const [activeTab, setActiveTab] = useState('overview');

  // Load datasets
  const [allAds, setAllAds] = useState<GemAd[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allReports, setAllReports] = useState<ReportAd[]>([]);
  const [allCategories, setAllCategories] = useState<GemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Form states for adding category
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch ads
      const adsSnap = await getDocs(collection(db, 'ads'));
      const adsList: GemAd[] = [];
      adsSnap.forEach((doc) => adsList.push(doc.data() as GemAd));
      setAllAds(adsList);

      // 2. Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList: UserProfile[] = [];
      usersSnap.forEach((doc) => usersList.push(doc.data() as UserProfile));
      setAllUsers(usersList);

      // 3. Fetch categories
      const catsSnap = await getDocs(collection(db, 'categories'));
      const catsList: GemCategory[] = [];
      catsSnap.forEach((doc) => catsList.push(doc.data() as GemCategory));
      setAllCategories(catsList);

      // 4. Fetch reports
      const reportsSnap = await getDocs(collection(db, 'reports'));
      const reportsList: ReportAd[] = [];
      reportsSnap.forEach((doc) => reportsList.push(doc.data() as ReportAd));
      setAllReports(reportsList);

    } catch (err) {
      console.error('Error fetching admin panels data:', err);
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

    if (userProfile && userProfile.role === 'admin') {
      loadAdminData();
    }
  }, [user, userProfile, authLoading]);

  // Loading Shield
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Verifying administrator credentials...</p>
      </div>
    );
  }

  // Authorization Shield
  if (!user || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-6 p-6 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/25 rounded-2xl shadow">
        <Lock className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-bold text-red-950 dark:text-red-400">Restricted Administration Space</h2>
        <p className="text-sm text-red-900/80 dark:text-red-300">
          This system requires full server administrator credentials. Your trade log has been archived.
        </p>
        <button
          onClick={() => navigate('home')}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Safe Zone
        </button>
      </div>
    );
  }

  // 1. Handle Ad Approval / Status change
  const handleUpdateAdStatus = async (adId: string, status: GemAd['status']) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status, updatedAt: new Date().toISOString() });
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to update ad status.');
    }
  };

  // 2. Toggle Featured Ad state
  const handleToggleFeatured = async (adId: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !currentVal, updatedAt: new Date().toISOString() });
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle featured promotion.');
    }
  };

  // 3. Toggle User Verification
  const handleToggleUserVerification = async (uid: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerifiedSeller: !currentVal });
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle seller verification status.');
    }
  };

  // Handle Delete User Account
  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to completely delete the profile for user: ${email}? This action is irreversible.`)) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user profile.');
    }
  };

  // Toggle User Suspend Status
  const handleToggleUserBlock = async (uid: string, currentBlocked: boolean, userEmail: string) => {
    if (uid === user?.uid) {
      alert('You cannot suspend your own admin account!');
      return;
    }
    const actionName = currentBlocked ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} user: ${userEmail}?`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), { isBlocked: !currentBlocked });
      await loadAdminData();
      alert(`User has been successfully ${actionName}ed!`);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${actionName} user.`);
    }
  };

  // Toggle User Admin Status
  const handleToggleUserAdmin = async (uid: string, currentRole: 'user' | 'admin', userEmail: string) => {
    if (uid === user?.uid) {
      alert('You cannot demote yourself!');
      return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change role of ${userEmail} to ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      await loadAdminData();
      alert(`User role has been updated to ${newRole}.`);
    } catch (err) {
      console.error(err);
      alert('Failed to update user role.');
    }
  };

  // Delete/Remove Any Ad Post
  const handleDeleteAd = async (adId: string, adTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the ad listing "${adTitle}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      await loadAdminData();
      alert('Gemstone listing deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete listing.');
    }
  };

  // 4. Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const catId = `cat_${newCatName.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now()}`;
    const newCategory: GemCategory = {
      id: catId,
      name: newCatName.trim(),
      description: newCatDesc.trim()
    };

    try {
      await setDoc(doc(db, 'categories', catId), newCategory);
      setNewCatName('');
      setNewCatDesc('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to create new category.');
    }
  };

  // 5. Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Listings under it may be affected.')) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  // 6. Create site announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const annId = `ann_${Date.now()}`;
    const newAnn: SiteAnnouncement = {
      id: annId,
      title: annTitle.trim(),
      content: annContent.trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      // Set all existing announcements to active = false first to ensure only 1 live alert
      const snap = await getDocs(collection(db, 'announcements'));
      for (const d of snap.docs) {
        await updateDoc(doc(db, 'announcements', d.id), { isActive: false });
      }

      await setDoc(doc(db, 'announcements', annId), newAnn);
      setAnnTitle('');
      setAnnContent('');
      alert('New alert deployed live successfully!');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to deploy live announcement.');
    }
  };

  // 7. Resolve reported ad
  const handleResolveReport = async (reportId: string, dismiss: boolean, adId?: string) => {
    try {
      if (!dismiss && adId) {
        // Delete flagged ad
        await deleteDoc(doc(db, 'ads', adId));
      }
      // Delete the report document
      await deleteDoc(doc(db, 'reports', reportId));
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve report.');
    }
  };

  const pendingAds = allAds.filter((ad) => ad.status === 'Pending Approval');
  const activeAdsCount = allAds.filter((ad) => ad.status === 'Active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-5">
        <h1 className="text-3xl font-sans font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-blue-500 animate-pulse" />
          Admin Control Center
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Perform administrative actions: review mineral specifications, approve/ban trading accounts, and announce site guidelines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800 gap-6 overflow-x-auto pb-1 select-none">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'approvals', name: `Approvals Queue (${pendingAds.length})` },
          { id: 'listings', name: `Manage Listings (${allAds.length})` },
          { id: 'users', name: 'Verified Traders & Blocking' },
          { id: 'announcements', name: 'Site Announcements' },
          { id: 'categories', name: 'Category Editor' },
          { id: 'reports', name: `Flagged Reports (${allReports.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-bold shrink-0 focus:outline-none ${activeTab === t.id ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-24 space-y-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-400">Loading site control configurations...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Bento grid metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Listings</span>
                  <div className="text-3xl font-black">{allAds.length}</div>
                  <p className="text-[10px] text-emerald-500 font-semibold">{activeAdsCount} Active live</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Registered Merchants</span>
                  <div className="text-3xl font-black">{allUsers.length}</div>
                  <p className="text-[10px] text-gray-400">Trade logs active</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Pending Review</span>
                  <div className="text-3xl font-black text-blue-500">{pendingAds.length}</div>
                  <p className="text-[10px] text-blue-500/80 font-semibold">Moderation needed</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Incoming Reports</span>
                  <div className="text-3xl font-black text-red-500">{allReports.length}</div>
                  <p className="text-[10px] text-red-400/80 font-semibold">Flagged safety risks</p>
                </div>
              </div>

              {/* Live listings checklist table */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 font-bold text-sm bg-zinc-50/40 dark:bg-zinc-900/10">
                  Global Listings Log
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50/30 border-b border-gray-100 dark:border-zinc-800 text-gray-400">
                        <th className="p-4">Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Featured</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                      {allAds.slice(0, 20).map((ad) => (
                        <tr key={ad.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                          <td className="p-4 font-bold max-w-[200px] truncate">{ad.title}</td>
                          <td className="p-4">{ad.category}</td>
                          <td className="p-4">{ad.price.toLocaleString()} LKR</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ad.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {ad.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)}
                              className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 border ${ad.isFeatured ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-zinc-100 border-zinc-200'}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {ad.isFeatured ? 'Featured' : 'Standard'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS QUEUE */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Moderation Verification Queue</h3>
              {pendingAds.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                  All gemstone listings have been approved or rejected.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingAds.map((ad) => (
                    <div key={ad.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 space-y-4">
                      <div className="flex gap-3">
                        <img src={ad.images[0]} alt="gem" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">{ad.title}</h4>
                          <p className="text-xs text-gray-400">{ad.weight} Cts · {ad.category} · {ad.treatment}</p>
                          <p className="text-xs text-blue-500 font-black mt-1">{ad.price.toLocaleString()} LKR</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-850 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 italic">
                        "{ad.description || 'No description provided.'}"
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => handleUpdateAdStatus(ad.id, 'Active')}
                          className="flex-1 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex justify-center items-center gap-1 hover:bg-emerald-600 transition-colors"
                        >
                          <Check className="h-4 w-4" /> Approve Listing
                        </button>
                        <button
                          onClick={() => handleUpdateAdStatus(ad.id, 'Rejected')}
                          className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" /> Reject Ad
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MANAGE ALL LISTINGS */}
          {activeTab === 'listings' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 font-bold text-sm bg-zinc-50/40 dark:bg-zinc-900/10 flex justify-between items-center">
                <span>All Live Marketplace Listings ({allAds.length})</span>
                <span className="text-[10px] text-gray-400">Total volume cataloged</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/30 border-b border-gray-100 dark:border-zinc-800 text-gray-400">
                      <th className="p-4">Gemstone Details</th>
                      <th className="p-4">Seller Info</th>
                      <th className="p-4">District</th>
                      <th className="p-4">Price / weight</th>
                      <th className="p-4">Moderation Status</th>
                      <th className="p-4">Featured Promo</th>
                      <th className="p-4 text-right">Delete Post</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                    {allAds.map((ad) => {
                      const seller = allUsers.find((usr) => usr.uid === ad.sellerId);
                      return (
                        <tr key={ad.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {ad.images && ad.images[0] && (
                                <img src={ad.images[0]} alt={ad.title} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-white hover:text-blue-500 cursor-pointer" onClick={() => navigate('ad-details', { adId: ad.id })}>
                                  {ad.title}
                                </div>
                                <div className="text-[10px] text-gray-400">Category: {ad.category} · Treatment: {ad.treatment}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-zinc-700 dark:text-zinc-300">{seller?.name || 'Unknown seller'}</p>
                              <p className="text-[10px] text-gray-400">{seller?.email || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-4">{ad.location}</td>
                          <td className="p-4">
                            <div className="font-bold text-blue-600 dark:text-blue-500">{ad.price.toLocaleString()} LKR</div>
                            <div className="text-[10px] text-gray-400">{ad.weight} Cts</div>
                          </td>
                          <td className="p-4">
                            <select
                              value={ad.status}
                              onChange={(e) => handleUpdateAdStatus(ad.id, e.target.value as any)}
                              className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded p-1 text-[11px] font-medium"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending Approval">Pending Approval</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Sold">Sold</option>
                              <option value="Expired">Expired</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)}
                              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 border ${ad.isFeatured ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {ad.isFeatured ? 'Featured' : 'Standard'}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteAd(ad.id, ad.title)}
                              className="p-1.5 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 transition-colors inline-flex items-center"
                              title="Delete Ad Post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TRADERS VERIFICATION MANAGER */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 font-bold text-sm bg-zinc-50/40 dark:bg-zinc-900/10 flex justify-between items-center">
                <span>Registered Gem Merchants Panel</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 font-black px-2 py-0.5 rounded">
                  Admin: rvgemsiteadmina@gmail.com
                </span>
              </div>
              <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 border-b border-gray-100 dark:border-zinc-800 flex items-start gap-2.5 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-500" />
                <div>
                  <span className="font-bold">Recommendation:</span> Permanent deletion of a profile document from the database does not prevent users from signing back in via Auth providers. To securely revoke access, use the <span className="font-black underline">Suspend</span> button. Suspended users are instantly locked out from posting ads, editing listings, or exchanging chat messages.
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/30 border-b border-gray-100 dark:border-zinc-800 text-gray-400">
                      <th className="p-4">Merchant Name & Email</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4">District</th>
                      <th className="p-4">Verified Seller Badge</th>
                      <th className="p-4">Admin Role</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                    {allUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img src={u.photoURL} alt={u.name} className="h-6 w-6 rounded-full shrink-0" />
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                {u.name}
                                {u.role === 'admin' && (
                                  <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1 rounded">Admin</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{u.phone || 'N/A'}</td>
                        <td className="p-4">{u.location}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserVerification(u.uid, u.isVerifiedSeller)}
                            className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 border ${u.isVerifiedSeller ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {u.isVerifiedSeller ? 'Verified (Revoke)' : 'Grant Verified'}
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserAdmin(u.uid, u.role || 'user', u.email)}
                            className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 border ${u.role === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-zinc-100 text-zinc-850 border-zinc-200'}`}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                        </td>
                        <td className="p-4">
                          {u.uid !== user?.uid ? (
                            <button
                              onClick={() => handleToggleUserBlock(u.uid, !!u.isBlocked, u.email)}
                              className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 border ${u.isBlocked ? 'bg-red-100 text-red-800 border-red-200' : 'bg-zinc-100 text-emerald-800 border-zinc-200'}`}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              {u.isBlocked ? 'Suspended (Unsuspend)' : 'Active (Suspend)'}
                            </button>
                          ) : (
                            <span className="text-gray-400 font-bold text-[10px] uppercase">Owner Admin</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.uid, u.email)}
                            className="p-1.5 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 transition-colors inline-flex items-center"
                            title="Delete Merchant Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SITE ANNOUNCEMENTS CREATOR */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <form onSubmit={handleCreateAnnouncement} className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm">Create New Site Header Alert</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Alert Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ratnapura Gems Fair Postponed"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Alert Banner Content</label>
                  <textarea
                    required
                    placeholder="e.g. Due to severe monsoon warnings, the local gem trade association advises all merchants to postpone physical auctions..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={4}
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Deploy Alert Live
                </button>
              </form>

              <div className="space-y-4">
                <h4 className="font-bold text-sm">System Guidelines Background</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Only one site announcement is displayed on the homepage. Creating a new alert automatically marks previous alerts as inactive, ensuring consistent messaging.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORY EDITOR */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Category form */}
              <form onSubmit={handleCreateCategory} className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm">Add New Gem Type Category</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Padparadscha"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Rare delicate pinkish-orange corundum gemstone"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors flex justify-center items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Create Category
                </button>
              </form>

              {/* Category List */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm">Existing Categories ({allCategories.length})</h4>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 text-xs">
                  {allCategories.map((c) => (
                    <div key={c.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-850">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                          <Gem className="h-3.5 w-3.5 text-blue-500" /> {c.name}
                        </p>
                        {c.description && <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1.5 hover:text-red-500"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FLAGGED REPORTS AND AUDITING */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Reported Flagged Ad Listings</h3>
              {allReports.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                  No listings have been flagged for review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allReports.map((r) => (
                    <div key={r.id} className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-5 space-y-4">
                      <div className="flex gap-2 items-start text-red-500">
                        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider">Report Reason: {r.reason}</h4>
                          <p className="text-[10px] text-gray-400">Reporter: {r.reporterEmail || 'Anonymous'}</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
                        <p className="font-bold">Flagged Ad: <strong className="text-blue-500">{r.adTitle}</strong></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Ad ID: {r.adId}</p>
                        <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed italic">
                          "Reporter commentary: {r.details || 'No additional details provided.'}"
                        </p>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => handleResolveReport(r.id, true)}
                          className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-gray-300 font-bold rounded-xl text-xs"
                        >
                          Dismiss Flag (Ad is Safe)
                        </button>
                        <button
                          onClick={() => handleResolveReport(r.id, false, r.adId)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" /> Ban & Delete Ad
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
