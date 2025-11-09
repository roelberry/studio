'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';
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
import { PlusCircle, MinusCircle, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const fileSchema = z.instanceof(File)
  .optional()
  .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 4MB.`)
  .refine(
    (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported."
  );

const linkSchema = z.object({
    name: z.string().min(1, 'Link name is required.'),
    url: z.string().url('Please enter a valid URL.'),
});

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  statement: z.string().min(10, 'Statement must be at least 10 characters.'),
  profileImage: fileSchema,
  existingGalleryUrls: z.array(z.string().url()),
  newGalleryImages: z.array(fileSchema),
  links: z.array(linkSchema).optional(),
  tags: z.array(z.object({ text: z.string().min(1) })).min(1, 'Please add at least one tag.'),
});

export default function EditArtistPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const artistId = params.id;
    const [artist, setArtist] = useState<Artist | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            statement: '',
            existingGalleryUrls: [],
            newGalleryImages: [],
            links: [{ name: '', url: '' }],
            tags: [{ text: '' }],
        },
    });

    useEffect(() => {
      if (!artistId || !firestore) return;
      const fetchArtist = async () => {
        setIsLoading(true);
        const docRef = doc(firestore, 'artists', artistId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedArtist = { id: docSnap.id, ...docSnap.data() } as Artist;
          setArtist(fetchedArtist);
          form.reset({
            name: fetchedArtist.name,
            statement: fetchedArtist.statement,
            existingGalleryUrls: fetchedArtist.gallery,
            links: fetchedArtist.links.length > 0 ? fetchedArtist.links : [{ name: '', url: '' }],
            tags: fetchedArtist.tags.map(text => ({ text })),
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

    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
        control: form.control,
        name: "links"
    });
     const { fields: newGalleryFields, append: appendNewGallery, remove: removeNewGallery } = useFieldArray({
        control: form.control,
        name: "newGalleryImages"
    });
    const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
        control: form.control,
        name: "tags"
    });

    const existingGalleryUrls = form.watch('existingGalleryUrls');
    const removeExistingGalleryImage = (index: number) => {
        const updatedUrls = [...existingGalleryUrls];
        updatedUrls.splice(index, 1);
        form.setValue('existingGalleryUrls', updatedUrls);
    }


    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!artist) return;

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('statement', values.statement);

        if (values.profileImage && values.profileImage.size > 0) {
            formData.append('profileImage', values.profileImage);
        }

        formData.append('existingGalleryUrls', JSON.stringify(values.existingGalleryUrls));
        values.newGalleryImages.forEach(file => {
             if (file && file.size > 0) {
                formData.append('gallery', file);
             }
        });
        
        if (values.links) {
            formData.append('links', JSON.stringify(values.links));
        }
        formData.append('tags', JSON.stringify(values.tags));

        const result = await updateArtist(artistId, formData, artist);
        
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
              
              <FormItem>
                <FormLabel>Profile Image</FormLabel>
                {artist?.profileImage && (
                    <div className="mb-4">
                        <Image src={artist.profileImage} alt="Current profile image" width={150} height={150} className="rounded-md object-cover" />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field: { onChange, value, ...rest } }) => (
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onChange(file);
                            }}
                            {...rest}
                        />
                    </FormControl>
                    )}
                />
                <FormDescription>Upload a new image to replace the current one.</FormDescription>
                <FormMessage />
              </FormItem>


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
                <FormLabel>Gallery Images</FormLabel>
                <FormDescription className="mb-4">Manage the artist's gallery images.</FormDescription>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {existingGalleryUrls.map((url, index) => (
                        <div key={index} className="relative group">
                            <Image src={url} alt={`Gallery image ${index + 1}`} width={200} height={200} className="rounded-md object-cover aspect-square" />
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeExistingGalleryImage(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <FormLabel className="text-sm font-medium">Add New Images</FormLabel>
                {newGalleryFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 py-2">
                    <FormField
                      control={form.control}
                      name={`newGalleryImages.${index}`}
                      render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                             <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onChange(file);
                                }}
                                {...rest}
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeNewGallery(index)}>
                      <MinusCircle className="text-destructive"/>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendNewGallery(undefined)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Image
                </Button>
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

    