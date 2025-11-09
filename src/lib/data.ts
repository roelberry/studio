
import 'server-only';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import type { Artist } from './types';
import { PlaceHolderImages } from './placeholder-images';

const { firestore } = initializeFirebase();

// Sample data for demonstration
const sampleArtists: Artist[] = [
  {
    id: 'jane-doe',
    name: 'Jane Doe',
    profileImage: PlaceHolderImages.find(p => p.id === 'artist-1-profile')?.imageUrl || '',
    statement:
      'Jane Doe is a muralist based in Indianapolis, focusing on themes of social justice and community empowerment. Her work aims to bring color and conversation to public spaces, creating art that is accessible to everyone and reflective of the neighborhood\'s spirit.',
    gallery: [
      PlaceHolderImages.find(p => p.id === 'artist-1-gallery-1')?.imageUrl || '',
      PlaceHolderImages.find(p => p.id === 'artist-1-gallery-2')?.imageUrl || '',
      PlaceHolderImages.find(p => p.id === 'artist-1-gallery-3')?.imageUrl || '',
      PlaceHolderImages.find(p => p.id === 'artist-1-gallery-4')?.imageUrl || '',
    ],
    links: [
      { name: 'Website', url: 'https://example.com' },
      { name: 'Instagram', url: 'https://instagram.com' },
    ],
    tags: ['Social Justice', 'Muralist', 'Community'],
  },
  {
    id: 'john-smith',
    name: 'John Smith',
    profileImage: PlaceHolderImages.find(p => p.id === 'artist-2-profile')?.imageUrl || '',
    statement:
      'Working with reclaimed materials, John Smith creates sculptures that explore the relationship between humanity and the environment. His art serves as a commentary on consumer culture and advocates for sustainability and ecological awareness.',
    gallery: [
      PlaceHolderImages.find(p => p.id === 'artist-2-gallery-1')?.imageUrl || '',
      PlaceHolderImages.find(p => p.id === 'artist-2-gallery-2')?.imageUrl || '',
    ],
    links: [
      { name: 'Portfolio', url: 'https://example.com' },
      { name: 'Twitter', url: 'https://twitter.com' },
    ],
    tags: ['Environmental Art', 'Sculpture', 'Recycled Art'],
  },
  {
    id: 'art-collective',
    name: 'The Art Collective',
    profileImage: PlaceHolderImages.find(p => p.id === 'artist-3-profile')?.imageUrl || '',
    statement:
      'The Art Collective is a group of multidisciplinary artists dedicated to using performance and public installations to engage with political and social issues. They facilitate workshops and collaborative projects that invite public participation and dialogue.',
    gallery: [
      PlaceHolderImages.find(p => p.id === 'artist-3-gallery-1')?.imageUrl || '',
      PlaceHolderImages.find(p => p.id === 'artist-3-gallery-2')?.imageUrl || '',
    ],
    links: [
        { name: 'Website', url: 'https://example.com' },
        { name: 'Facebook', url: 'https://facebook.com' },
    ],
    tags: ['Performance Art', 'Installation', 'Activism'],
  },
];


export async function getArtists(): Promise<Artist[]> {
  const artistsCollection = collection(firestore, 'artists');
  try {
    const snapshot = await getDocs(artistsCollection);
    if (snapshot.empty) {
      return sampleArtists; // Return sample data if Firestore is empty
    }
    const firestoreArtists = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Artist));
    return [...firestoreArtists, ...sampleArtists.filter(sa => !firestoreArtists.find(fa => fa.id === sa.id))];
  } catch (error) {
    console.error("Error fetching artists, returning sample data:", error);
    return sampleArtists;
  }
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const sampleArtist = sampleArtists.find(artist => artist.id === id);
  
  const docRef = doc(firestore, 'artists', id);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Artist;
    } else {
      // If not in firestore, return from sample data
      return sampleArtist;
    }
  } catch (error) {
      console.error(`Error fetching artist by ID "${id}", returning sample data if available:`, error);
      return sampleArtist;
  }
}
