
import 'server-only';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import type { Artist } from './types';

const { firestore } = initializeFirebase();

export async function getArtists(): Promise<Artist[]> {
  const artistsCollection = collection(firestore, 'artists');
  try {
    const snapshot = await getDocs(artistsCollection);
    if (snapshot.empty) {
      return []; // Return empty array if Firestore is empty
    }
    const firestoreArtists = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
    return firestoreArtists;
  } catch (error) {
    console.error("Error fetching artists:", error);
    return []; // Return empty array on error
  }
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const docRef = doc(firestore, 'artists', id);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Artist;
    } else {
      return undefined;
    }
  } catch (error) {
      console.error(`Error fetching artist by ID "${id}":`, error);
      return undefined;
  }
}
