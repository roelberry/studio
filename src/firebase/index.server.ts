
import 'server-only';

import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApps()[0]);
  }

  try {
    // First, try to initialize with the default application credentials.
    // This is the standard for deployed Google Cloud environments (like App Hosting).
    const firebaseApp = initializeApp({
      credential: applicationDefault(),
      projectId: firebaseConfig.projectId,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
    return getSdks(firebaseApp);
  } catch (e) {
    console.warn(
      'Could not initialize with default credentials, falling back to config. This is normal for local development.',
      e
    );
    // Fallback for local development or environments without default credentials.
    // This uses the configuration from firebase/config.ts.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
}

export function getSdks(firebaseApp: App) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}
