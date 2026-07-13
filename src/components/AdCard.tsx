import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GemAd } from '../types';
import { MapPin, Sparkles, Heart, ChevronRight, Eye } from 'lucide-react';

interface AdCardProps {
  ad: GemAd;
  onClick: () => void;
  key?: string;
}

export default function AdCard({ ad, onClick }: AdCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('ratnagem-wishlist') || '[]');
    setIsFavorited(favs.includes(ad.id));
  }, [ad.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('ratnagem-wishlist') || '[]');
    let updatedFavs = [];
    if (favs.includes(ad.id)) {
      updatedFavs = favs.filter((id: string) => id !== ad.id);
      setIsFavorited(false);
    } else {
      updatedFavs = [...favs, ad.id];
      setIsFavorited(true);
    }
    localStorage.setItem('ratnagem-wishlist', JSON.stringify(updatedFavs));
    // Trigger storage event to sync other components
    window.dispatchEvent(new Event('storage'));
  };

  const formattedPrice = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  }).format(ad.price);

  const getStatusBadge = () => {
    switch (ad.status) {
      case 'Sold':
        return <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md z-10 uppercase tracking-wider">Sold</span>;
      case 'Pending Approval':
        return <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-md z-10 uppercase tracking-wider">Reviewing</span>;
      case 'Rejected':
        return <span className="absolute top-3 left-3 bg-zinc-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md z-10 uppercase tracking-wider">Rejected</span>;
      default:
        return ad.isFeatured ? (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md z-10 uppercase tracking-widest flex items-center">
            <Sparkles className="h-3 w-3 mr-1 animate-spin" /> Featured
          </span>
        ) : null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-700/50 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Ad Badges */}
      {getStatusBadge()}

      {/* Wishlist Toggle Button */}
      <button
        onClick={toggleFavorite}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-gray-400 hover:text-red-500 transition-colors shadow-sm focus:outline-none"
      >
        <Heart className={`h-4.5 w-4.5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Gem Photo Container */}
      <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <img
          src={ad.images[0] || 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop'}
          alt={ad.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Shimmer gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-xs font-semibold flex items-center">
            View Details <Eye className="ml-1 h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Gem Details */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category & Weight */}
        <div className="flex justify-between items-center text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
          <span>{ad.category}</span>
          <span>{ad.weight.toFixed(2)} Cts</span>
        </div>

        {/* Ad Title */}
        <h3 className="font-sans font-semibold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors mb-2">
          {ad.title}
        </h3>

        {/* Spec tags bento */}
        <div className="grid grid-cols-2 gap-1 mb-3">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] text-zinc-500 dark:text-gray-400 px-2 py-1 rounded text-center truncate">
            {ad.treatment}
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] text-zinc-500 dark:text-gray-400 px-2 py-1 rounded text-center truncate">
            {ad.shape}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Price & Location footer */}
        <div className="pt-3 border-t border-gray-50 dark:border-zinc-700/50 flex items-center justify-between mt-auto">
          <div>
            <div className="font-sans font-bold text-base text-zinc-950 dark:text-white flex items-center gap-1">
              {formattedPrice}
            </div>
            {ad.isNegotiable && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Negotiable</span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-400 truncate max-w-[120px]">
            <MapPin className="h-3 w-3 text-blue-500 mr-0.5 shrink-0" />
            <span className="truncate">{ad.location}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
