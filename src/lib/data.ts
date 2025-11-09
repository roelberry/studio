import 'server-only';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import type { Artist } from './types';

const { firestore } = initializeFirebase();

export async function getArtists(): Promise<Artist[]> {
  const artistsCollection = collection(firestore, 'artists');
  const snapshot = await getDocs(artistsCollection);
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const docRef = doc(firestore, 'artists', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Artist;
  } else {
    return undefined;
  }
}
