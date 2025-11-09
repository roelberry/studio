'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Artist } from '@/lib/types';


import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import { updateArtist } from '../../actions';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const linkSchema = z.object({
    name: z.string().min(1, 'Link name is required.'),
    url: z.string().url('Please enter a valid URL.'),
});

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  profileImage: z.string().url('Please enter a valid URL.'),
  statement: z.string().min(10, 'Statement must be at least 10 characters.'),
  gallery: z.string().min(1, 'Please add at least one gallery image URL.'),
  links: z.array(linkSchema).optional(),
  tags: z.string().min(1, 'Please add at least one tag.'),
});

export default function EditArtistPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const artistId = params.id;
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            profileImage: '',
            statement: '',
            gallery: '',
            links: [{ name: '', url: '' }],
            tags: '',
        },
    });

    useEffect(() => {
      if (!artistId || !firestore) return;
      const fetchArtist = async () => {
        setIsLoading(true);
        const docRef = doc(firestore, 'artists', artistId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const artist = docSnap.data() as Omit<Artist, 'id'>;
          form.reset({
            name: artist.name,
            profileImage: artist.profileImage,
            statement: artist.statement,
            gallery: artist.gallery.join(', '),
            links: artist.links.length > 0 ? artist.links : [{ name: '', url: '' }],
            tags: artist.tags.join(', '),
          });
        } else {
          toast({
            variant: "destructive",
            title: "Not Found",
            description: "No artist found with this ID.",
          });
          router.push('/admin');
        }
        setIsLoading(false);
      };
      fetchArtist();
    }, [artistId, firestore, form, router, toast]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "links"
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const result = await updateArtist(artistId, values);
        
        if (result.success) {
            toast({
                title: "Success!",
                description: `Artist "${values.name}" has been updated.`,
            })
            router.push('/admin');
        } else {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: result.error || "There was a problem with your request.",
            })
        }
    }

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-9 w-1/2" />
                    <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Artist</CardTitle>
          <CardDescription>Update the details for {form.getValues('name')}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist/Collective Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>The main image for the artist card.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Statement</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about the artist's work..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gallery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gallery Image URLs</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter URLs, separated by commas" rows={3} {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of image URLs for the artist's gallery.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Social Justice, Muralist" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of tags.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Links</FormLabel>
                <FormDescription className="mb-4">Add links to the artist's website, social media, etc.</FormDescription>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4 py-2">
                        <FormField
                        control={form.control}
                        name={`links.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Link Name (e.g. Website)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`links.${index}.url`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="URL (e.g. https://...)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1 && form.getValues(`links.${index}.name`) === '' && form.getValues(`links.${index}.url`) === ''}>
                            <MinusCircle className="text-destructive"/>
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ name: '', url: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Link
                </Button>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Updating...' : 'Update Artist'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
                    Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
