import { getArtists } from '@/lib/data';
import { ArtistCard } from '@/components/artist-card';
import { Skeleton } from '@/components/ui/skeleton';

export async function ArtistGallery() {
  const artists = await getArtists();

  if (artists.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No artists found. Add artists via the admin page.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}

export function GallerySkeleton() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="aspect-w-4 aspect-h-3 w-full" />
            <div className="space-y-2 px-1">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  