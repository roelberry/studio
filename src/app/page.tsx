import { ArtistCard } from '@/components/artist-card';
import { getArtists } from '@/lib/data';

export default async function Home() {
  const artists = await getArtists();

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
      
      {artists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground">No artists found. Add artists via the admin page.</p>
        </div>
      )}
    </div>
  );
}
