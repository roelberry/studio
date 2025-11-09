'use server';

import { z } from 'zod';
import { collection, addDoc } from "firebase/firestore"; 
import { initializeFirebase } from '@/firebase/index.server';

const { firestore } = initializeFirebase();

const formSchema = z.object({
  name: z.string().min(2),
  profileImage: z.string().url(),
  statement: z.string().min(10),
  gallery: z.string().min(1),
  links: z.string().optional(),
  tags: z.string().min(1),
});

export async function addArtist(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid fields' };
  }

  const { name, profileImage, statement, gallery, links, tags } = validatedFields.data;

  try {
    const galleryArray = gallery.split(',').map(url => url.trim()).filter(url => url);
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const linksArray = links ? JSON.parse(links) : [];

    const artistData = {
        name,
        profileImage,
        statement,
        gallery: galleryArray,
        links: linksArray,
        tags: tagsArray
    };
    
    const docRef = await addDoc(collection(firestore, "artists"), artistData);
    console.log("Document written with ID: ", docRef.id);


    return { success: true };
  } catch (error) {
    console.error("Error adding artist: ", error);
    if (error instanceof SyntaxError) {
        return { success: false, error: 'Failed to parse links JSON. Please check the format.' };
    }
    return { success: false, error: 'Failed to add artist.' };
  }
}
