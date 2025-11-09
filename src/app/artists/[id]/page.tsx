import { getArtistById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Globe, Instagram, Twitter, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-headline tracking-tight text-foreground">{artist.name}</h1>
        <div className="mt-4 flex justify-center flex-wrap gap-2">
            {artist.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
        </div>
      </header>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-lg text-foreground/80 leading-relaxed">{artist.statement}</p>
        </CardContent>
      </Card>

      {artist.gallery.length > 0 && (
        <section>
          <h2 className="text-3xl font-headline mb-4 text-center">Gallery</h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {artist.gallery.map((imgUrl, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video relative">
                         <Image
                            src={imgUrl}
                            alt={`${artist.name}'s work ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            data-ai-hint="artwork installation"
                          />
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      )}

      {artist.links.length > 0 && (
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
