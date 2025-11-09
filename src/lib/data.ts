import 'server-only';
import type { Artist } from './types';
import { PlaceHolderImages } from './placeholder-images';

// In a real application, you'd fetch this from a database like Firestore.
// For this example, we're using mock data.
// NOTE: To make this work with a real Firestore backend, you would:
// 1. Set up a `firebase.ts` config file.
// 2. Use functions like `getDocs` and `doc` from `firebase/firestore`.
// 3. The `artists` collection would live in your Firestore database.

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const mockArtists: Artist[] = [
  {
    id: 'jane-doe',
    name: 'Jane Doe',
    profileImage: findImage('artist-1-profile'),
    statement: "Through large-scale murals and community-led workshops, my work confronts social inequality and imagines a more just future. I believe art is a powerful tool for dialogue and change, capable of transforming public spaces into platforms for unheard voices.",
    gallery: [
      findImage('artist-1-gallery-1'),
      findImage('artist-1-gallery-2'),
    ],
    links: [
      { name: 'Website', url: '#' },
      { name: 'Instagram', url: '#' },
    ],
    tags: ['Social Justice', 'Muralist', 'Community'],
  },
  {
    id: 'john-smith',
    name: 'John Smith',
    profileImage: findImage('artist-2-profile'),
    statement: "I create sculptures from reclaimed and natural materials to explore our relationship with the environment. Each piece is a commentary on consumer culture and a celebration of nature's resilience, urging viewers to consider their own ecological footprint.",
    gallery: [
        findImage('artist-2-gallery-1'),
        findImage('artist-2-gallery-2'),
    ],
    links: [
      { name: 'Website', url: '#' },
    ],
    tags: ['Environmental Art', 'Sculpture', 'Sustainability'],
  },
  {
    id: 'art-collective',
    name: 'The People\'s Collective',
    profileImage: findImage('artist-3-profile'),
    statement: "We are a collective of multidisciplinary artists dedicated to political activism through performance, printmaking, and direct action. Our work is ephemeral, interventionist, and aims to empower and mobilize our communities towards political change.",
    gallery: [
        findImage('artist-3-gallery-1'),
        findImage('artist-3-gallery-2'),
    ],
    links: [
      { name: 'Website', url: '#' },
      { name: 'Twitter', url: '#' },
    ],
    tags: ['Political', 'Performance', 'Collective'],
  },
];

// In a real app, these functions would be async and fetch from Firestore
export async function getArtists(): Promise<Artist[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app:
  // const snapshot = await getDocs(collection(db, "artists"));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
  
  return mockArtists;
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app:
  // const docRef = doc(db, "artists", id);
  // const docSnap = await getDoc(docRef);
  // return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Artist : undefined;

  return mockArtists.find(artist => artist.id === id);
}
