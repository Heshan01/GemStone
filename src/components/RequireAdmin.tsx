import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

interface RequireAdminProps {
  children: React.ReactNode;
  navigate: (route: string, params?: any) => void;
}

export default function RequireAdmin({ children, navigate }: RequireAdminProps) {
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-6 p-6 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/25 rounded-2xl shadow">
        <Lock className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-red-950 dark:text-red-400">Restricted Administration Space</h2>
        <p className="text-sm text-red-900/80 dark:text-red-300">
          This system requires full server administrator credentials. Your trade log has been archived.
        </p>
        <button
          onClick={() => navigate('home')}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-semibold"
        >
          Return to Safe Zone
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
