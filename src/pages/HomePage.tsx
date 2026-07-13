import React, { useEffect, useState } from 'react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GemAd, SiteAnnouncement, GemCategory } from '../types';
import Hero from '../components/Hero';
import AdCard from '../components/AdCard';
import { GridSkeleton } from '../components/Skeleton';
import { Megaphone, Gem, ChevronRight, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface HomePageProps {
  navigate: (route: string, params?: any) => void;
}

export default function HomePage({ navigate }: HomePageProps) {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);
  const [featuredAds, setFeaturedAds] = useState<GemAd[]>([]);
  const [latestAds, setLatestAds] = useState<GemAd[]>([]);
  const [categories, setCategories] = useState<GemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active announcements (optimizing to avoid composite index)
        const annRef = collection(db, 'announcements');
        const annQuery = query(annRef, limit(10));
        const annSnap = await getDocs(annQuery);
        const announcements: SiteAnnouncement[] = [];
        annSnap.forEach((doc) => {
          const data = doc.data() as SiteAnnouncement;
          if (data.isActive) {
            announcements.push(data);
          }
        });
        announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (announcements.length > 0) {
          setAnnouncement(announcements[0]);
        }

        // Fetch categories
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats: GemCategory[] = [];
        catSnap.forEach((doc) => cats.push(doc.data() as GemCategory));
        setCategories(cats);

        // Fetch featured ads (Active only, optimizing to avoid composite index)
        const adsRef = collection(db, 'ads');
        const featuredQuery = query(
          adsRef,
          where('isFeatured', '==', true),
          limit(20)
        );
        const featSnap = await getDocs(featuredQuery);
        const feat: GemAd[] = [];
        featSnap.forEach((doc) => {
          const ad = doc.data() as GemAd;
          if (ad.status === 'Active') {
            feat.push(ad);
          }
        });
        feat.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Fetch latest ads (Active only, optimizing to avoid composite index)
        const latestQuery = query(
          adsRef,
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const latSnap = await getDocs(latestQuery);
        const lat: GemAd[] = [];
        latSnap.forEach((doc) => {
          const ad = doc.data() as GemAd;
          if (ad.status === 'Active') {
            lat.push(ad);
          }
        });
        setLatestAds(lat.slice(0, 8));

        // Set featured ads (Active & explicitly featured only, without falling back to latest)
        setFeaturedAds(feat.slice(0, 4));

      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    navigate('ads', { initialFilters: { category: categoryName } });
  };

  return (
    <div className="space-y-8 pb-16 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. HERO BANNER */}
      <Hero onSearch={(kw) => navigate('ads', { initialQuery: kw })} navigate={navigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 2. SYSTEM ANNOUNCEMENT (IF ACTIVE) */}
        {announcement && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-950 dark:text-blue-400">
                {announcement.title}
              </h4>
              <p className="text-xs text-blue-900/80 dark:text-blue-300/85 mt-1 leading-relaxed">
                {announcement.content}
              </p>
            </div>
          </div>
        )}

        {/* 3. QUICK-LINKS CATEGORIES */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-sans font-bold text-zinc-950 dark:text-white">
                Browse by Gem Type
              </h2>
              <p className="text-xs text-gray-400">Select a category to filter listings instantly.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className="flex items-center gap-2 p-3.5 bg-zinc-50 hover:bg-blue-500/10 hover:border-blue-500/50 dark:bg-zinc-900/50 dark:hover:bg-blue-950/20 rounded-xl border border-gray-100 dark:border-zinc-800 transition-all text-left text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                <Gem className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. PROMOTED / FEATURED ADS CAROUSEL-GRID */}
        {featuredAds.length > 0 && (
          <div className="space-y-6 bg-gradient-to-br from-blue-500/5 to-transparent p-6 rounded-2xl border border-blue-500/10 shadow-sm">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-black tracking-widest flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1 animate-spin" /> Premium Showcases
                </span>
                <h2 className="text-2xl font-sans font-extrabold text-zinc-950 dark:text-white mt-1">
                  Featured Gemstones
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={() => navigate('ad-details', { adId: ad.id })} />
              ))}
            </div>
          </div>
        )}

        {/* 5. LATEST LISTINGS */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-sans font-bold text-zinc-950 dark:text-white">
                Latest Gemstone Ads
              </h2>
              <p className="text-xs text-gray-400">Newly listed active ads from Sri Lankan gem merchants.</p>
            </div>
            <button
              onClick={() => navigate('ads')}
              className="group text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 focus:outline-none"
            >
              See All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loading ? (
            <GridSkeleton count={4} />
          ) : latestAds.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 space-y-3">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-500">No active gemstone listings found.</p>
              <button
                onClick={() => navigate('post-ad')}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 font-medium rounded-lg text-xs text-white"
              >
                Be the first to Post an Ad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={() => navigate('ad-details', { adId: ad.id })} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
