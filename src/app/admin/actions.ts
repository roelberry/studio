'use server';

import { z } from 'zod';
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';
import type { Artist } from '@/lib/types';

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
  tags: z.string().optional(), // JSON string
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
    gallery: formData.getAll('gallery').filter(f => (f as File).size > 0),
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
    
    const docRef = await addDoc(collection(firestore, "artists"), artistData);
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/artists/${docRef.id}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error adding artist: ", errorMessage);
    return { success: false, error: `Failed to add artist: ${errorMessage}` };
  }
}

const updateFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  statement: z.string().min(10, 'Statement must be at least 10 characters.'),
  links: z.string().optional(),
  tags: z.string().optional(),
});


export async function updateArtist(id: string, formData: FormData, existingArtist: Artist) {
  const rawFormData = {
    name: formData.get('name'),
    statement: formData.get('statement'),
    links: formData.get('links'),
    tags: formData.get('tags'),
  };

  const validatedFields = updateFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid fields provided.' };
  }
  
  const { name, statement, links, tags } = validatedFields.data;

  try {
    const artistDocRef = doc(firestore, "artists", id);
    const updatedData: Partial<Artist> = {
      name,
      statement,
      links: links ? JSON.parse(links) : [],
      tags: tags ? JSON.parse(tags).map((tag: { text: string }) => tag.text) : [],
    };

    const newProfileImage = formData.get('profileImage') as File | null;
    if (newProfileImage && newProfileImage.size > 0) {
      if (existingArtist.profileImage) {
        try {
          const oldImageRef = ref(storage, existingArtist.profileImage);
          await deleteObject(oldImageRef);
        } catch (storageError) {
           console.warn("Could not delete old profile image, it may have already been removed:", storageError);
        }
      }
      updatedData.profileImage = await uploadImage(newProfileImage, name);
    }
    
    const newGalleryImages = formData.getAll('gallery') as File[];
    const existingGalleryUrls: string[] = JSON.parse(formData.get('existingGalleryUrls') as string || '[]');

    const urlsToDelete = existingArtist.gallery.filter(url => !existingGalleryUrls.includes(url));
    for (const url of urlsToDelete) {
       try {
        const oldImageRef = ref(storage, url);
        await deleteObject(oldImageRef);
      } catch (storageError) {
         console.warn(`Could not delete old gallery image ${url}, it may have already been removed:`, storageError);
      }
    }
    
    const uploadedUrls = await Promise.all(
      newGalleryImages
        .filter(file => file.size > 0)
        .map(file => uploadImage(file, name))
    );

    updatedData.gallery = [...existingGalleryUrls, ...uploadedUrls];


    await setDoc(artistDocRef, updatedData, { merge: true });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/artists/${id}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error updating artist:", errorMessage);
    return { success: false, error: `Failed to update artist: ${errorMessage}` };
  }
}

async function deleteImagesFromStorage(imageUrls: string[]) {
    const deletePromises = imageUrls.map(async (url) => {
        try {
            const imageRef = ref(storage, url);
            await deleteObject(imageRef);
        } catch (error: any) {
            if (error.code === 'storage/object-not-found') {
                console.warn(`Image not found, skipping delete: ${url}`);
            } else {
                console.error(`Failed to delete image from storage: ${url}`, error);
            }
        }
    });
    await Promise.all(deletePromises);
}

export async function deleteArtist(artistId: string) {
    const docRef = doc(firestore, "artists", artistId);
    try {
        const artistDoc = await getDoc(docRef);
        if (!artistDoc.exists()) {
            return { success: false, error: "Artist not found." };
        }
        const artistData = artistDoc.data() as Artist;
        
        // Delete all associated images from Firebase Storage
        const imageUrlsToDelete = [artistData.profileImage, ...artistData.gallery];
        await deleteImagesFromStorage(imageUrlsToDelete);

        await deleteDoc(docRef);
        
        revalidatePath('/');
        revalidatePath('/admin');
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting artist:", error);
        return { success: false, error: "Failed to delete artist." };
    }
}

    