import { Suspense } from 'react';
import { ArtistGallery, GallerySkeleton } from '@/components/artist-gallery';

export default async function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight lg:text-5xl text-foreground">
          Indiana Artivist Directory
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover artists and collectives using their work for social change.
        </p>
      </div>
      
      <Suspense fallback={<GallerySkeleton />}>
        <ArtistGallery />
      </Suspense>
    </div>
  );
}
