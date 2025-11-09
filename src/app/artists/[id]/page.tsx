import { getArtistById } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArtistProfile } from './artist-profile';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtistById(params.id);
  if (!artist) {
    return {
      title: 'Artist Not Found',
    };
  }
  return {
    title: `${artist.name} | Indiana Artivist Directory`,
    description: artist.statement.substring(0, 160),
  };
}

export default async function ArtistProfilePage({ params }: Props) {
  const artist = await getArtistById(params.id);

  if (!artist) {
    notFound();
  }

  return <ArtistProfile artist={artist} />;
}
