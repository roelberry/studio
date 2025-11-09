import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Indiana Arctivist Directory',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">About This Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-lg text-foreground/80">
          <p>
            The Indiana Arctivist Directory is a curated, shareable webpage designed to showcase and promote Indiana-based art activists.
          </p>
          <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
            Our mission is to inspire others with a compilation of local artists who are raising awareness and encouraging social, political, and environmental change.
          </blockquote>
          <p>
            The goal is to make their work more visible, foster connections, and inspire community engagement. This project was created for a university class exploring how online publications and web design can be used for community-building and art-activism.
          </p>
          <p className="text-base text-muted-foreground pt-4">
            Project created by the Art & Activism Group.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
