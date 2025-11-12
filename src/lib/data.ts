
import 'server-only';
// Use the correct Firestore functions from the Admin SDK
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import type { Artist } from './types';

// IMPORTANT: We must initialize Firebase within each function to ensure it's
// only done when the function is actively called during server-side rendering.
// Initializing it at the top level of the module can cause conflicts.

export async function getArtists(): Promise<Artist[]> {
  // The firestore instance here is from the Admin SDK
  const { firestore } = initializeFirebase();
  const artistsCollection = firestore.collection('artists');
  try {
    const snapshot = await artistsCollection.get();
    if (snapshot.empty) {
      return []; // Return empty array if Firestore is empty
    }
    // Use the admin SDK's way of accessing doc data
    const firestoreArtists = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
    return firestoreArtists;
  } catch (error) {
    console.error("Error fetching artists:", error);
    return []; // Return empty array on error
  }
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const { firestore } = initializeFirebase();
  const docRef = firestore.doc(`artists/${id}`);
  try {
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Artist;
    } else {
      return undefined;
    }
  } catch (error) {
      console.error(`Error fetching artist by ID "${id}":`, error);
      return undefined;
  }
}
