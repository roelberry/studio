import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Instagram, Twitter, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react';
import type { Artist } from '@/lib/types';
import { ArtistGallery } from './artist-gallery';

const iconMap: { [key: string]: React.ElementType } = {
  website: Globe,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  default: LinkIcon,
};

function getIcon(name: string) {
    const Icon = iconMap[name.toLowerCase()] || iconMap.default;
    return <Icon className="h-5 w-5" />;
}

export function ArtistProfile({ artist }: { artist: Artist }) {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-5xl font-headline tracking-tight text-foreground">{artist.name}</h1>
        <div className="mt-4 flex justify-center flex-wrap gap-2">
            {artist.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </header>
      
      <section>
        <h2 className="text-3xl font-headline mb-4 text-center">Artist Statement</h2>
        <Card>
            <CardContent className="p-6">
                <p className="text-lg text-foreground/80 leading-relaxed">{artist.statement}</p>
            </CardContent>
        </Card>
      </section>

      {artist.gallery && artist.gallery.length > 0 && <ArtistGallery artist={artist} />}

      {artist.links && artist.links.length > 0 && (
        <section className="text-center">
             <h2 className="text-3xl font-headline mb-4">Connect</h2>
             <div className="flex justify-center items-center gap-4">
                {artist.links.map((link) => (
                    <Button key={link.name} variant="outline" size="lg" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {getIcon(link.name)}
                            <span className="ml-2">{link.name}</span>
                        </a>
                    </Button>
                ))}
             </div>
        </section>
      )}
    </div>
  );
}
