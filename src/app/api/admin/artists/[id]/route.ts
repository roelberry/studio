import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/index.server';
import { deleteArtist, updateArtist } from '@/app/admin/actions';
import type { Artist } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();

    const { firestore } = initializeFirebase();
    const artistDoc = await firestore.collection('artists').doc(id).get();

    if (!artistDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Artist not found.' },
        { status: 404 }
      );
    }

    const existingArtist = { id: artistDoc.id, ...artistDoc.data() } as Artist;
    const result = await updateArtist(id, formData, existingArtist);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Failed to update artist via API:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error updating artist.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await deleteArtist(id);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Failed to delete artist via API:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error deleting artist.' },
      { status: 500 }
    );
  }
}
