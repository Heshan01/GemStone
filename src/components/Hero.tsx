import React, { useState } from 'react';
import { Search, MapPin, Gem, Users, ShoppingBag } from 'lucide-react';

interface HeroProps {
  onSearch: (keyword: string) => void;
  navigate: (route: string, params?: any) => void;
}

export default function Hero({ onSearch, navigate }: HeroProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    navigate('ads', { initialQuery: query });
  };

  return (
    <div className="relative bg-zinc-950 text-white overflow-hidden py-16 sm:py-24 border-b border-zinc-800">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]"></div>
      <div className="absolute top-0 right-0 h-96 w-96 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Tagline Badge */}
          <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Gem className="h-3.5 w-3.5 animate-spin-slow" /> Official Sri Lankan Gem Trade Hub
          </span>

          {/* Heading */}
          <h1 className="font-sans font-black text-4xl sm:text-6xl tracking-tight leading-none text-white">
            Discover Exquisite <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400">
              Sri Lankan Gemstones
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Trade directly with the verified miners, lapidarists, and exporters of Ratnapura. From rare Blue Sapphires to Padparadschas, find authentic Ceylon stones with ease.
          </p>

          {/* Unified Search Bar */}
          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden p-2 shadow-2xl">
              <div className="flex items-center flex-grow px-3 py-1.5 text-zinc-900 dark:text-white">
                <Search className="h-5 w-5 text-gray-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search Blue Sapphire, Ruby, Heated, 3 Cts..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2 text-zinc-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-all focus:outline-none shrink-0"
              >
                Search Listings
              </button>
            </div>
          </form>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-4 pt-12 max-w-xl mx-auto border-t border-zinc-900 mt-12">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-500">100%</div>
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Ceylon Origin</div>
            </div>
            <div className="text-center border-x border-zinc-900">
              <div className="text-xl sm:text-2xl font-bold text-blue-500">Direct</div>
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Buyer-Seller Chat</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-500">Verified</div>
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">Ratnapura Community</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
