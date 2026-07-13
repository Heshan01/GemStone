export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  phone?: string;
  location: string; // e.g. "Ratnapura", "Beruwala", etc.
  bio?: string;
  isVerifiedSeller: boolean;
  isBlocked: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface GemAd {
  id: string;
  title: string;
  category: string; // e.g. "Blue Sapphire", "Ruby", "Cat's Eye", etc.
  sellerId: string;
  images: string[];
  weight: number; // in carats
  color: string;
  shape: string;
  treatment: string; // "Heated", "Unheated", etc.
  origin?: string; // "Ratnapura", "Elahera", "Madagascar", etc.
  price: number;
  isNegotiable: boolean;
  description: string;
  contactPreference: 'phone' | 'chat' | 'both';
  location: string; // e.g. district/city
  status: 'Active' | 'Sold' | 'Pending Approval' | 'Rejected' | 'Expired' | 'Suspended';
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  adId: string;
  adTitle: string;
  adPrice: number;
  adImage: string;
  buyerId: string;
  sellerId: string;
  participants: string[]; // [buyerId, sellerId]
  lastMessage: string;
  lastMessageAt: string;
  unreadBuyer: boolean;
  unreadSeller: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ReportAd {
  id: string;
  adId: string;
  reporterId: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  reporterEmail?: string;
  adTitle?: string;
}

export interface GemCategory {
  id: string;
  name: string;
  description?: string;
}

export interface SiteAnnouncement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  createdAt: string;
}
