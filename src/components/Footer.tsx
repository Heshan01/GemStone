import React from 'react';
import { Gem, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer({ navigate }: { navigate: (route: string) => void }) {
  return (
    <footer className="bg-zinc-950 text-gray-400 py-12 border-t border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
              <Gem className="h-7 w-7 text-blue-500 mr-2" />
              <span className="font-sans font-bold text-lg tracking-tight text-white">
                Ratna<span className="text-blue-500">Gem</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Connecting buyers and sellers across Ratnapura, Beruwala, Elahera, and beyond. Sri Lanka's premier offline-to-online marketplace for premium, verified gemstones.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('home')} className="hover:text-blue-500 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('ads')} className="hover:text-blue-500 transition-colors">
                  Browse Gemstones
                </button>
              </li>
              <li>
                <button onClick={() => navigate('profile')} className="hover:text-blue-500 transition-colors">
                  My Profile
                </button>
              </li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Trading Safety</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>Verify certifications in person</li>
              <li>Avoid advanced payments before viewing</li>
              <li>Trade at secure locations in Ratnapura</li>
              <li>Report suspicious listings instantly</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Community Center</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                <span>Gem Street, Ratnapura, Sri Lanka</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                <span>support@ratnagem.lk</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-500" />
                <span>+94 45 222 4567</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2026 RatnaGem Marketplace. Developed for the Sri Lankan Gem Trade Community.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-blue-500 cursor-pointer">Terms & Conditions</span>
            <span className="hover:text-blue-500 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
