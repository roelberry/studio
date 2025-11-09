import Link from 'next/link';
import Image from 'next/image';
import type { Artist } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link href={`/artists/${artist.id}`} className="group block">
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
        <CardHeader className="p-0">
          <div className="aspect-w-4 aspect-h-3 relative overflow-hidden">
            <Image
              src={artist.profileImage}
              alt={`Artwork by ${artist.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="mural art"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="font-headline text-xl leading-tight">{artist.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {artist.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
