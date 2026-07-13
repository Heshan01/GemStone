import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Firestore Error Logging / Telemetry Utility matching strict AI Studio instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Rule Exception: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getAuthErrorMessage(err: any): string {
  const message = err?.message || '';
  const code = err?.code || '';
  
  if (code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
    return 'No trader account found with this email. Please sign up or check your email.';
  }
  if (code === 'auth/wrong-password' || message.includes('auth/wrong-password')) {
    return 'Incorrect password. Please verify and try again.';
  }
  if (code === 'auth/invalid-email' || message.includes('auth/invalid-email')) {
    return 'The email address is invalid. Please enter a valid email address.';
  }
  if (code === 'auth/email-already-in-use' || message.includes('auth/email-already-in-use')) {
    return 'An account is already registered with this email. Please log in instead.';
  }
  if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
    return 'The password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/too-many-requests' || message.includes('auth/too-many-requests')) {
    return 'Access has been temporarily disabled due to multiple failed login attempts. Please try again later.';
  }
  if (code === 'auth/network-request-failed' || message.includes('auth/network-request-failed')) {
    return 'A network error occurred. Please check your internet connection.';
  }
  
  return message || 'Authentication failed. Please try again.';
}

