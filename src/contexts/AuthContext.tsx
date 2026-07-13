import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (email: string, pass: string, name: string, location: string, phone: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrapped Admin check
  const BOOTSTRAP_ADMIN_EMAIL = 'rvgemsiteadmina@gmail.com';

  const fetchOrCreateProfile = async (firebaseUser: User, customData?: { name?: string; location?: string; phone?: string }) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (getErr) {
      console.error('Error fetching user profile document:', getErr);
      handleFirestoreError(getErr, OperationType.GET, `users/${firebaseUser.uid}`);
    }

    try {
      if (userSnap.exists()) {
        let data = userSnap.data() as UserProfile;
        
        // If this is the deprecated old admin email, completely demote and strip admin role/badge
        if (data.email.toLowerCase() === 'heshandilhara004@gmail.com' && (data.role !== 'user' || data.isVerifiedSeller !== false)) {
          data = {
            ...data,
            role: 'user',
            isVerifiedSeller: false
          };
          try {
            await setDoc(userRef, data);
          } catch (updateErr) {
            // Silently log the warning. Since Firestore rules prevent non-admin/unprivileged writes
            // to role/isVerifiedSeller, this write is expected to fail once they are no longer admin.
            // The demoted state is still successfully applied to the local React state.
            console.warn('Silent demotion database write error (expected if rules block self-demotion):', updateErr);
          }
        }
        
        setUserProfile(data);
        return data;
      } else {
        // Create new profile
        const email = firebaseUser.email || '';
        const isBootstrappedAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: customData?.name || firebaseUser.displayName || 'Anonymous Trader',
          email: email,
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customData?.name || firebaseUser.displayName || 'AT')}`,
          phone: customData?.phone || firebaseUser.phoneNumber || '',
          location: customData?.location || 'Ratnapura',
          bio: 'Gem trading community member.',
          isVerifiedSeller: isBootstrappedAdmin, // Verify immediately if admin
          isBlocked: false,
          role: isBootstrappedAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(userRef, newProfile);
        } catch (createErr) {
          console.error('Error creating new user profile:', createErr);
          handleFirestoreError(createErr, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('General error fetching/creating profile:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (getErr) {
      handleFirestoreError(getErr, OperationType.GET, `users/${user.uid}`);
    }

    try {
      if (userSnap.exists()) {
        let data = userSnap.data() as UserProfile;
        
        // If this is the deprecated old admin email, completely demote and strip admin role/badge
        if (data.email.toLowerCase() === 'heshandilhara004@gmail.com' && (data.role !== 'user' || data.isVerifiedSeller !== false)) {
          data = {
            ...data,
            role: 'user',
            isVerifiedSeller: false
          };
          try {
            await setDoc(userRef, data);
          } catch (updateErr) {
            // Silently log self-demotion write error (expected if security rules block self-demotion)
            console.warn('Silent demotion database write error on refresh (expected):', updateErr);
          }
        }
        
        setUserProfile(data);
      }
    } catch (error) {
      console.error('General error refreshing profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email: string, pass: string, name: string, location: string, phone: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      });
      await fetchOrCreateProfile(userCredential.user, { name, location, phone });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      await fetchOrCreateProfile(userCredential.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await fetchOrCreateProfile(userCredential.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
