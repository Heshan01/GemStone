import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BrowseGemsPage from './pages/BrowseGemsPage';
import AdDetailsPage from './pages/AdDetailsPage';
import PostAdPage from './pages/PostAdPage';
import MyAdsPage from './pages/MyAdsPage';
import ProfilePage from './pages/ProfilePage';
import ChatInboxPage from './pages/ChatInboxPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RequireAdmin from './components/RequireAdmin';
import { initDatabase } from './lib/dbInit';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

function AppContent() {
  const { user, userProfile, logout } = useAuth();
  
  // Custom State-based Router
  const [route, setRoute] = useState('home');
  const [params, setParams] = useState<any>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // Trigger DB seeding on app bootstrap
  useEffect(() => {
    initDatabase();
  }, []);

  // Listen to unread chats count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const room = doc.data();
        const isBuyer = user.uid === room.buyerId;
        const unread = isBuyer ? room.unreadBuyer : room.unreadSeller;
        if (unread) count++;
      });
      setUnreadCount(count);
    }, (err) => {
      console.warn('Error listening to unread counts in navbar:', err);
    });

    return unsubscribe;
  }, [user]);

  // Simple navigation proxy helper
  const navigate = (newRoute: string, routeParams: any = {}) => {
    setRoute(newRoute);
    setParams(routeParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render active page view
  const renderActivePage = () => {
    switch (route) {
      case 'home':
        return <HomePage navigate={navigate} />;
      case 'login':
        return <LoginPage navigate={navigate} />;
      case 'signup':
        return <SignupPage navigate={navigate} />;
      case 'ads':
        return (
          <BrowseGemsPage
            navigate={navigate}
            initialQuery={params?.initialQuery || ''}
            initialFilters={params?.initialFilters}
          />
        );
      case 'ad-details':
        return <AdDetailsPage adId={params?.adId} navigate={navigate} />;
      case 'post-ad':
        return <PostAdPage navigate={navigate} editAdId={params?.editAdId} />;
      case 'my-ads':
        return <MyAdsPage navigate={navigate} />;
      case 'profile':
        return <ProfilePage navigate={navigate} initialTab={params?.initialTab || 'profile'} />;
      case 'chat':
        return <ChatInboxPage navigate={navigate} initialChatId={params?.chatId} />;
      case 'admin':
        return (
          <RequireAdmin navigate={navigate}>
            <AdminDashboardPage navigate={navigate} />
          </RequireAdmin>
        );
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  if (userProfile?.isBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 text-center transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-sans font-black tracking-tight text-red-600 dark:text-red-400">Merchant Account Suspended</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Your gemstone trading profile has been blocked by the server administration for policy violations or suspicious activities. Direct chat negotiations and gemstone listings have been archived.
          </p>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-[11px] text-gray-400">
            Contact Admin: <strong className="text-blue-500">rvgemsiteadmina@gmail.com</strong>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('home');
            }}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Dynamic Navigation Bar */}
      <Navbar navigate={navigate} currentRoute={route} unreadChatsCount={unreadCount} />

      {/* Main Screen Active Page View */}
      <main className="flex-grow">
        {renderActivePage()}
      </main>

      {/* Footer */}
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
