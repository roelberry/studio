'use server';

import { z } from 'zod';
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore"; 
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';

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
    
    const validLinks = links ? links.filter(link => link.name && link.url) : [];

    const artistData = {
        name,
        profileImage,
        statement,
        gallery: galleryArray,
        links: validLinks,
        tags: tagsArray
    };
    
    await addDoc(collection(firestore, "artists"), artistData);
    
    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error("Error adding artist: ", error);
    return { success: false, error: 'Failed to add artist.' };
  }
}

export async function updateArtist(id: string, values: z.infer<typeof formSchema>) {
    const validatedFields = formSchema.safeParse(values);

    if (!validatedFields.success) {
        return { success: false, error: 'Invalid fields' };
    }

    const { name, profileImage, statement, gallery, links, tags } = validatedFields.data;
    const docRef = doc(firestore, "artists", id);

    try {
        const galleryArray = gallery.split(',').map(url => url.trim()).filter(url => url);
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        const validLinks = links ? links.filter(link => link.name && link.url) : [];

        const artistData = {
            name,
            profileImage,
            statement,
            gallery: galleryArray,
            links: validLinks,
            tags: tagsArray
        };

        await setDoc(docRef, artistData, { merge: true });

        revalidatePath('/');
        revalidatePath(`/artists/${id}`);
        revalidatePath('/admin');

        return { success: true };
    } catch (error) {
        console.error("Error updating artist: ", error);
        return { success: false, error: 'Failed to update artist.' };
    }
}


export async function deleteArtist(id: string) {
    const docRef = doc(firestore, "artists", id);
    try {
        await deleteDoc(docRef);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Error deleting artist:", error);
        return { success: false, error: "Failed to delete artist." };
    }
}
