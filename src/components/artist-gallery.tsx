
'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Artist } from '@/lib/types';
import { ArtistCard } from '@/components/artist-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

function ArtistGallery({ artists, allTags }: { artists: Artist[], allTags: string[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredArtists = useMemo(() => {
    return artists.filter(artist => {
      const nameMatch = artist.name.toLowerCase().includes(searchTerm.toLowerCase());
      const tagMatch = selectedTag ? artist.tags.includes(selectedTag) : true;
      return nameMatch && tagMatch;
    });
  }, [artists, searchTerm, selectedTag]);

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by artist name..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <Badge
                variant={!selectedTag ? 'default' : 'secondary'}
                onClick={() => setSelectedTag(null)}
                className="cursor-pointer"
            >
                All
            </Badge>
            {allTags.map(tag => (
                <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'secondary'}
                    onClick={() => setSelectedTag(tag)}
                    className="cursor-pointer"
                >
                    {tag}
                </Badge>
            ))}
        </div>
      </div>

      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No artists found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
}


export function GallerySkeleton() {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-grow" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
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
      </div>
    );
}

export function ArtistGalleryWrapper({ initialArtists }: { initialArtists: Artist[] }) {
    const [artists, setArtists] = useState<Artist[]>(initialArtists);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        // Wait until firestore is available.
        if (!firestore) {
          // We still show initial artists, but loading is true until we connect to Firestore.
          setIsLoading(initialArtists.length === 0);
          return;
        }

        // We have a firestore instance, so we are loading live data.
        setIsLoading(true);
        const artistsCollection = collection(firestore, 'artists');
        const unsubscribe = onSnapshot(artistsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
            const firestoreArtists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
            setArtists(firestoreArtists);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching artists:", error);
            // Fallback to initial artists if firestore fails on the client.
            setArtists(initialArtists);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, initialArtists]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        artists.forEach(artist => {
            artist.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [artists]);

    if (isLoading) {
        return <GallerySkeleton />;
    }

    if (artists.length === 0) {
        return (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No artists found. Add artists via the admin page.</p>
            </div>
        );
    }
    
    return <ArtistGallery artists={artists} allTags={allTags} />;
}
