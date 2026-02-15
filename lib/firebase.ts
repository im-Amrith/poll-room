import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Validate Firebase configuration
const missingVars: string[] = [];
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
if (!firebaseConfig.appId || firebaseConfig.appId.includes('your_')) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.error('❌ Missing or invalid Firebase configuration!');
  console.error('Please update the following in your .env.local file:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nSee FIREBASE-SETUP.md for instructions.');
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

// Database Types
export interface Poll {
  id: string;
  question: string;
  created_at: Timestamp | Date;
}

export interface Option {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
  created_at: Timestamp | Date;
}

export interface Vote {
  id: string;
  poll_id: string;
  ip_hash: string;
  device_id: string;
  created_at: Timestamp | Date;
}
