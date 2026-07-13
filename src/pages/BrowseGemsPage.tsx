import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GemAd, GemCategory } from '../types';
import AdCard from '../components/AdCard';
import { GridSkeleton } from '../components/Skeleton';
import { Filter, Search, RotateCcw, SlidersHorizontal, MapPin, BadgeDollarSign, Compass } from 'lucide-react';

interface BrowseGemsPageProps {
  navigate: (route: string, params?: any) => void;
  initialQuery?: string;
  initialFilters?: { category?: string };
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

const TREATMENTS = [
  'Unheated (100% Natural)',
  'Heated Only (Traditional)',
  'Beryllium Treated',
  'Glass Filled',
  'Irradiated'
];

const SHAPES = [
  'Oval',
  'Cushion',
  'Round',
  'Emerald Cut',
  'Pear',
  'Marquise',
  'Princess',
  'Cabochon'
];

export default function BrowseGemsPage({ navigate, initialQuery = '', initialFilters }: BrowseGemsPageProps) {
  const [ads, setAds] = useState<GemAd[]>([]);
  const [filteredAds, setFilteredAds] = useState<GemAd[]>([]);
  const [categories, setCategories] = useState<GemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [selectedShape, setSelectedShape] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');

  // Sort State
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-asc', 'price-desc'

  // Expand filters on mobile
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch categories
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats: GemCategory[] = [];
        catSnap.forEach((doc) => cats.push(doc.data() as GemCategory));
        setCategories(cats);

        // Fetch all active ads (optimizing to avoid composite index)
        const adsRef = collection(db, 'ads');
        const activeQuery = query(adsRef, orderBy('createdAt', 'desc'));
        const adsSnap = await getDocs(activeQuery);
        const activeAds: GemAd[] = [];
        adsSnap.forEach((doc) => {
          const ad = doc.data() as GemAd;
          if (ad.status === 'Active') {
            activeAds.push(ad);
          }
        });
        setAds(activeAds);
      } catch (err) {
        console.error('Error fetching ads list:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter & Sort Logic (Client-side for index stability and offline speed)
  useEffect(() => {
    let result = [...ads];

    // Search keyword filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          ad.description.toLowerCase().includes(q) ||
          ad.color.toLowerCase().includes(q) ||
          ad.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((ad) => ad.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Location filter
    if (selectedLocation) {
      result = result.filter((ad) => ad.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    // Treatment filter
    if (selectedTreatment) {
      result = result.filter((ad) => ad.treatment === selectedTreatment);
    }

    // Shape filter
    if (selectedShape) {
      result = result.filter((ad) => ad.shape === selectedShape);
    }

    // Price range filters
    if (minPrice) {
      result = result.filter((ad) => ad.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter((ad) => ad.price <= parseFloat(maxPrice));
    }

    // Weight range filters
    if (minWeight) {
      result = result.filter((ad) => ad.weight >= parseFloat(minWeight));
    }
    if (maxWeight) {
      result = result.filter((ad) => ad.weight <= parseFloat(maxWeight));
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredAds(result);
  }, [ads, search, selectedCategory, selectedLocation, selectedTreatment, selectedShape, minPrice, maxPrice, minWeight, maxWeight, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedTreatment('');
    setSelectedShape('');
    setMinPrice('');
    setMaxPrice('');
    setMinWeight('');
    setMaxWeight('');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-tight text-zinc-900 dark:text-white">
            Exquisite Gemstones
          </h1>
          <p className="text-xs text-gray-500">
            Showing {filteredAds.length} active trade listings.
          </p>
        </div>

        {/* Search Bar + Mobile toggle */}
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search gems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-300"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar (Responsive) */}
        <div className={`space-y-6 lg:block ${showFilters ? 'block bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-lg fixed inset-x-4 top-20 z-40 max-h-[80vh] overflow-y-auto' : 'hidden'}`}>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-4 w-4 text-blue-500" /> Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 focus:outline-none"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <div className="space-y-4">
            {/* Gem Category */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Gem Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Trading Location */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">District / Origin</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="">All Locations</option>
                {DISTRICTS.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Treatment Status</label>
              <select
                value={selectedTreatment}
                onChange={(e) => setSelectedTreatment(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="">All Treatments</option>
                {TREATMENTS.map((t, i) => (
                  <option key={i} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Shape */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Cut Shape</label>
              <select
                value={selectedShape}
                onChange={(e) => setSelectedShape(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="">All Shapes</option>
                {SHAPES.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Price Range (LKR)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-2.5 py-2 focus:outline-none"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-2.5 py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Carats Range */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Weight (Carats)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Min Cts"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-2.5 py-2 focus:outline-none"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Max Cts"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-2.5 py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">Sort Listings</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="newest">Newest Ads First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Mobile close filter button */}
          <button
            onClick={() => setShowFilters(false)}
            className="md:hidden w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl mt-4"
          >
            Apply Filters
          </button>
        </div>

        {/* Listings Grid */}
        <div className="col-span-1 lg:col-span-3">
          {loading ? (
            <GridSkeleton count={6} />
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 space-y-4">
              <Compass className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-bold">No Matching Listings Found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Try widening your filters, clearing search criteria, or exploring other gem categories.
              </p>
              <button
                onClick={resetFilters}
                className="py-2 px-4 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl text-xs font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={() => navigate('ad-details', { adId: ad.id })} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
