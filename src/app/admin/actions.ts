
'use server';

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebase } from '@/firebase/index.server';
import { revalidatePath } from 'next/cache';
import type { Artist } from '@/lib/types';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function uploadImage(file: File, artistName: string, bucket: any): Promise<string> {
    console.log('uploadImage artistName:', artistName);
    const sanitizedName = artistName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `artists/${sanitizedName}-${Date.now()}-${file.name}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());

    const gcsFile = bucket.file(fileName);
    await gcsFile.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });
    
    const [url] = await gcsFile.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A long time in the future
    });

    return url;
}

export async function addArtist(formData: FormData) {
  const { firestore, storage } = initializeFirebase();
  const bucket = storage.bucket('gs://studio-8522178126-1c4ba.appspot.com');
  try {
    const name = formData.get('name') as string;
    const statement = formData.get('statement') as string;
    const profileImage = formData.get('profileImage') as File;
    const galleryFiles = formData.getAll('gallery').filter(f => (f as File).size > 0) as File[];
    const links = formData.get('links') as string | null;
    const tags = formData.get('tags') as string | null;

    // --- Manual Server-Side Validation ---
    if (!name || name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }
    if (!statement || statement.length < 10) {
      return { success: false, error: 'Statement must be at least 10 characters.' };
    }
    if (!profileImage || profileImage.size === 0) {
      return { success: false, error: 'A profile image is required.' };
    }
    if (galleryFiles.length === 0) {
      return { success: false, error: 'At least one gallery image is required.' };
    }
    // --- End Validation ---

    const profileImageURL = await uploadImage(profileImage, name, bucket);

    const galleryImageURLs = await Promise.all(
        galleryFiles.map(file => uploadImage(file, name, bucket))
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
    
    const docRef = await firestore.collection("artists").add(artistData);
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/artists/${docRef.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding artist:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to add artist: ${errorMessage}` };
  }
}

export async function updateArtist(id: string, formData: FormData, existingArtist: Artist) {
  const { firestore, storage } = initializeFirebase();
  const bucket = storage.bucket('gs://studio-8522178126-1c4ba.appspot.com');
  const name = formData.get('name') as string;
  const statement = formData.get('statement') as string;
  const links = formData.get('links') as string | null;
  const tags = formData.get('tags') as string | null;

  if (!name || name.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters.' };
  }
  if (!statement || statement.length < 10) {
    return { success: false, error: 'Statement must be at least 10 characters.' };
  }
  
  try {
    const artistDocRef = firestore.collection("artists").doc(id);
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
          const oldImageRef = bucket.file(new URL(existingArtist.profileImage).pathname.substring(1));
          await oldImageRef.delete();
        } catch (storageError) {
           console.warn("Could not delete old profile image, it may have already been removed:", storageError);
        }
      }
      updatedData.profileImage = await uploadImage(newProfileImage, name, bucket);
    }
    
    const newGalleryImages = formData.getAll('gallery') as File[];
    const existingGalleryUrls: string[] = JSON.parse(formData.get('existingGalleryUrls') as string || '[]');

    const urlsToDelete = existingArtist.gallery.filter(url => !existingGalleryUrls.includes(url));
    for (const url of urlsToDelete) {
       try {
        const oldImageRef = bucket.file(new URL(url).pathname.substring(1));
        await oldImageRef.delete();
      } catch (storageError) {
         console.warn(`Could not delete old gallery image ${url}, it may have already been removed:`, storageError);
      }
    }
    
    const uploadedUrls = await Promise.all(
      newGalleryImages
        .filter(file => file.size > 0)
        .map(file => uploadImage(file, name, bucket))
    );

    updatedData.gallery = [...existingGalleryUrls, ...uploadedUrls];


    await artistDocRef.set(updatedData, { merge: true });

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

async function deleteImagesFromStorage(imageUrls: string[], bucket: any) {
    const deletePromises = imageUrls.map(async (url) => {
        if (!url) return;
        try {
            const imageRef = bucket.file(new URL(url).pathname.substring(1));
            await imageRef.delete();
        } catch (error: any) {
            if (error.code === 404) {
                console.warn(`Image not found in storage, skipping delete: ${url}`);
            } else {
                console.error(`Failed to delete image from storage: ${url}`, error);
            }
        }
    });
    await Promise.all(deletePromises);
}

export async function deleteArtist(artistId: string) {
    const { firestore, storage } = initializeFirebase();
    const bucket = storage.bucket('gs://studio-8522178126-1c4ba.appspot.com');
    const docRef = firestore.collection("artists").doc(artistId);
    try {
        // It's more robust to fetch the doc to get image URLs before deleting.
        const artistDoc = await docRef.get();
        if (artistDoc.exists) {
            const artistData = artistDoc.data() as Artist;
            // Delete all associated images from Firebase Storage
            const imageUrlsToDelete = [artistData.profileImage, ...artistData.gallery].filter(Boolean);
            if (imageUrlsToDelete.length > 0) {
              await deleteImagesFromStorage(imageUrlsToDelete, bucket);
            }
        } else {
           console.warn(`Artist document ${artistId} not found for deletion. Images in storage might be orphaned.`);
        }

        await docRef.delete();
        
        revalidatePath('/');
        revalidatePath('/admin');
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting artist:", error);
        return { success: false, error: "Failed to delete artist." };
    }
}
