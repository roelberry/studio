'use server';

import { z } from 'zod';
import { collection, addDoc } from "firebase/firestore"; 
import { initializeFirebase } from '@/firebase/index.server';

const { firestore } = initializeFirebase();

const linkSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
});

const formSchema = z.object({
  name: z.string().min(2),
  profileImage: z.string().url(),
  statement: z.string().min(10),
  gallery: z.string().min(1),
  links: z.array(linkSchema).optional(),
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
    
    // Filter out any empty link objects that might be submitted
    const validLinks = links ? links.filter(link => link.name && link.url) : [];

    const artistData = {
        name,
        profileImage,
        statement,
        gallery: galleryArray,
        links: validLinks,
        tags: tagsArray
    };
    
    const docRef = await addDoc(collection(firestore, "artists"), artistData);
    console.log("Document written with ID: ", docRef.id);

    return { success: true };
  } catch (error) {
    console.error("Error adding artist: ", error);
    return { success: false, error: 'Failed to add artist.' };
  }
}
