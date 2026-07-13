import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gem, Mail, Lock, User, MapPin, Phone, AlertCircle } from 'lucide-react';
import { getAuthErrorMessage } from '../lib/firebase';

interface SignupPageProps {
  navigate: (route: string) => void;
}

const DISTRICTS = [
  'Ratnapura',
  'Beruwala',
  'Elahera',
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna',
  'Ambalangoda',
  'Balangoda'
];

export default function SignupPage({ navigate }: SignupPageProps) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(DISTRICTS[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name, location, phone);
      navigate('home');
    } catch (err: any) {
      console.error(err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('home');
    } catch (err: any) {
      console.error(err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30">
            <Gem className="h-10 w-10 text-blue-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-sans font-extrabold text-zinc-900 dark:text-white">
          Create trader account
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Or{' '}
          <button
            onClick={() => navigate('login')}
            className="font-medium text-blue-500 hover:text-blue-600 focus:outline-none"
          >
            log in to your existing account
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100 dark:border-zinc-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                Full Name or Company Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Heshan Dilhara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="trader@ratnagem.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                Contact Phone / WhatsApp
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Location dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                Primary Trading District
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                >
                  {DISTRICTS.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                  Confirm
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Google Sign Up */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-white dark:bg-zinc-900 text-gray-400">
                  Or register with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-gray-200 transition-colors focus:outline-none"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.166 1 1.25 5.916 1.25 12s4.916 11 10.99 11c6.338 0 10.564-4.455 10.564-10.74 0-.72-.078-1.27-.172-1.815H12.24z"
                  />
                </svg>
                Register with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
