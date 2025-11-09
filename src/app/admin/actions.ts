'use server';

import { z } from 'zod';
// import { db } from '@/lib/firebase';
// import { collection, addDoc } from "firebase/firestore"; 

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
    
    // TODO: Add data to Firestore
    // For now, we'll just log it to the console.
    console.log("New artist data to be added to Firestore:", artistData);
    // In a real application, you would uncomment the following lines:
    // const docRef = await addDoc(collection(db, "artists"), artistData);
    // console.log("Document written with ID: ", docRef.id);


    return { success: true };
  } catch (error) {
    console.error("Error adding artist: ", error);
    if (error instanceof SyntaxError) {
        return { success: false, error: 'Failed to parse links JSON. Please check the format.' };
    }
    return { success: false, error: 'Failed to add artist.' };
  }
}
