
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { artists } from '../src/lib/artists-data.js'; 

// You might need to download this from your Firebase project settings
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';

console.log('Initializing Firebase...');
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function seedArtists() {
  console.log('Seeding artists...');
  const artistsCollection = db.collection('artists');
  
  for (const artist of artists) {
    try {
      await artistsCollection.doc(artist.id).set(artist);
      console.log(`Added artist: ${artist.name}`);
    } catch (error) {
      console.error(`Error adding artist ${artist.name}:`, error);
    }
  }
  
  console.log('Seeding complete.');
}

seedArtists();
