
import { ArtistGalleryWrapper } from '@/components/artist-gallery';
import { getArtists } from '@/lib/data';

export default async function Home() {
  const initialArtists = await getArtists();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight lg:text-5xl text-foreground">
          Indiana Art Activist Directory
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover artists and collectives using their work for social change.
        </p>
      </div>
      
      <ArtistGalleryWrapper initialArtists={initialArtists} />
    </div>
  );
}
