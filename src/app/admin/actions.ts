'use server';

import { z } from 'zod';
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';

const { firestore, storage } = initializeFirebase();

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// This server-side schema focuses on presence, not file-specifics,
// as those are best validated on the client.
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  statement: z.string().min(10, 'Statement must be at least 10 characters.'),
  profileImage: z.instanceof(File).refine((file) => file.size > 0, 'Profile image is required.'),
  gallery: z.array(z.instanceof(File)).min(1, 'At least one gallery image is required.'),
  links: z.string().optional(), // JSON string
  tags: z.string(), // JSON string
});

async function uploadImage(file: File, artistName: string): Promise<string> {
    const sanitizedName = artistName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${sanitizedName}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `artists/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

export async function addArtist(formData: FormData) {

  const rawFormData = {
    name: formData.get('name'),
    statement: formData.get('statement'),
    profileImage: formData.get('profileImage'),
    gallery: formData.getAll('gallery'),
    links: formData.get('links'),
    tags: formData.get('tags'),
  };

  const validatedFields = formSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return { success: false, error: 'Invalid fields provided.' };
  }

  const { name, statement, profileImage, gallery, links, tags } = validatedFields.data;

  try {
    const profileImageURL = await uploadImage(profileImage, name);

    const galleryImageURLs = await Promise.all(
        gallery.map(file => uploadImage(file, name))
    );
    
    const parsedLinks = links ? JSON.parse(links) : [];
    const parsedTags = tags ? JSON.parse(tags).map((tag: { text: string }) => tag.text) : [];

    const artistData = {
        name,
        statement,
        profileImage: profileImageURL,
        gallery: galleryImageURLs,
        links: parsedLinks,
        tags: parsedTags,
    };
    
    await addDoc(collection(firestore, "artists"), artistData);
    
    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error adding artist: ", errorMessage);
    return { success: false, error: `Failed to add artist: ${errorMessage}` };
  }
}

export async function updateArtist(id: string, values: any) {
    // This function will need to be implemented fully to handle file uploads.
    // For now, we leave the existing structure and will update it in a subsequent step.
    console.log("updateArtist needs implementation for file uploads", id, values);
    return { success: false, error: 'Update functionality not yet implemented for file uploads.' };
}

export async function deleteArtist(id: string) {
    const docRef = doc(firestore, "artists", id);
    try {
        await deleteDoc(docRef);
        // Note: This does not delete images from storage. A more complete solution would.
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Error deleting artist:", error);
        return { success: false, error: "Failed to delete artist." };
    }
}
