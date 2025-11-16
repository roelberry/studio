import { NextResponse } from 'next/server';
import { addArtist } from '@/app/admin/actions';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await addArtist(formData);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Failed to submit artist via API:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error submitting artist.' },
      { status: 500 }
    );
  }
}
