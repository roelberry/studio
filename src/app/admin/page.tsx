'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
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
import { addArtist, deleteArtist } from './actions';
import { PlusCircle, MinusCircle, Trash2, Edit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';

const linkSchema = z.object({
    name: z.string().min(1, 'Link name is required.'),
    url: z.string().url('Please enter a valid URL.'),
});

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  profileImage: z.string().url('Please enter a valid URL.'),
  statement: z.string().min(10, 'Statement must be at least 10 characters.'),
  gallery: z.array(z.object({ url: z.string().url() })).min(1, 'Please add at least one gallery image URL.'),
  links: z.array(linkSchema).optional(),
  tags: z.array(z.object({ text: z.string().min(1) })).min(1, 'Please add at least one tag.'),
});

export default function AdminPage() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const artistsCollection = collection(firestore, 'artists');
      const unsubscribe = onSnapshot(artistsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
        const artistsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artist));
        setArtists(artistsData);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [firestore]);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            profileImage: '',
            statement: '',
            gallery: [{ url: '' }],
            links: [{ name: '', url: '' }],
            tags: [{ text: '' }],
        },
    });

    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
        control: form.control,
        name: "links"
    });
     const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({
        control: form.control,
        name: "gallery"
    });
    const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
        control: form.control,
        name: "tags"
    });


    async function onSubmit(values: z.infer<typeof formSchema>) {
        const result = await addArtist(values);
        
        if (result.success) {
            toast({
                title: "Success!",
                description: `Artist "${values.name}" has been added.`,
            })
            form.reset();
        } else {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: result.error || "There was a problem with your request.",
            })
        }
    }

    async function handleDelete(artistId: string, artistName: string) {
      const result = await deleteArtist(artistId);
      if (result.success) {
        toast({
          title: "Artist Deleted",
          description: `"${artistName}" has been removed from the directory.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: result.error || "Could not remove the artist."
        });
      }
    }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Add New Artist</CardTitle>
          <CardDescription>This form adds a new artist to the Firestore database.</CardDescription>
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
              
              <div>
                <FormLabel>Gallery Image URLs</FormLabel>
                <FormDescription className="mb-4">Add URLs for the artist's gallery.</FormDescription>
                {galleryFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 py-2">
                    <FormField
                      control={form.control}
                      name={`gallery.${index}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="https://example.com/gallery-image.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGallery(index)} disabled={galleryFields.length <= 1}>
                      <MinusCircle className="text-destructive"/>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendGallery({ url: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Image URL
                </Button>
                 <FormMessage>{form.formState.errors.gallery?.message}</FormMessage>
              </div>

              <div>
                <FormLabel>Tags</FormLabel>
                <FormDescription className="mb-4">Add tags that describe the artist's work.</FormDescription>
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 py-2">
                    <FormField
                      control={form.control}
                      name={`tags.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g., Social Justice" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTag(index)} disabled={tagFields.length <= 1}>
                      <MinusCircle className="text-destructive"/>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTag({ text: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
                 <FormMessage>{form.formState.errors.tags?.message}</FormMessage>
              </div>

              <div>
                <FormLabel>Links</FormLabel>
                <FormDescription className="mb-4">Add links to the artist's website, social media, etc.</FormDescription>
                {linkFields.map((field, index) => (
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} disabled={linkFields.length <= 1 && form.getValues(`links.${index}.name`) === '' && form.getValues(`links.${index}.url`) === ''}>
                            <MinusCircle className="text-destructive"/>
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendLink({ name: '', url: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Link
                </Button>
              </div>

              <Separator />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Artist'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Manage Artists</CardTitle>
          <CardDescription>Edit or delete existing artists in the directory.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
          <div className="space-y-2">
            {artists.map(artist => (
              <div key={artist.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                <span className="font-medium">{artist.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => router.push(`/admin/edit/${artist.id}`)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the artist "{artist.name}" from the directory.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(artist.id, artist.name)}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
