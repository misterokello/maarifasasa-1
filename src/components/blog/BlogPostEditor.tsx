
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import slugify from 'slugify';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import { ImageUpload } from './ImageUpload';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { fetchCategories, createOrUpdatePost } from '@/lib/api/blog';
import { useQuery } from '@tanstack/react-query';
import { BlogPost } from '@/lib/api/blog';
import { supabase } from '@/integrations/supabase/client';

const blogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  meta_image: z.string().optional(),
  published: z.boolean().default(false),
  scheduled_publish: z.boolean().default(false),
  publish_date: z.date().optional(),
  publish_time: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogPostEditorProps {
  initialPost?: BlogPost;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ initialPost, onCancel, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [categoryId, setCategoryId] = useState<string>(initialPost?.category_id || "uncategorized");
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | undefined>(
    initialPost?.published_at ? new Date(initialPost.published_at) : undefined
  );
  const navigate = useNavigate();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: fetchCategories,
  });

  // Initialize form
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initialPost?.title || '',
      slug: initialPost?.slug || '',
      content: initialPost?.content || '',
      excerpt: initialPost?.excerpt || '',
      featured_image: initialPost?.featured_image || '',
      meta_image: initialPost?.meta_image || '',
      published: initialPost?.published || false,
      scheduled_publish: false,
      publish_date: initialPost?.published_at ? new Date(initialPost.published_at) : undefined,
      publish_time: initialPost?.published_at 
        ? format(new Date(initialPost.published_at), 'HH:mm')
        : '09:00',
    },
  });

  // Generate slug from title
  const generateSlug = () => {
    const title = form.getValues('title');
    if (title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      form.setValue('slug', newSlug);
    }
  };

  // Handle form submission
  const handleSave = async (values: BlogFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      const authorId = userId || 'e9d74232-b39f-4a38-8efb-fd9820272cad';
      
      // Handle scheduled publishing
      let published = values.published;
      let publishedAt = null;
      
      if (values.scheduled_publish && values.publish_date && values.publish_time) {
        const [hours, minutes] = values.publish_time.split(':');
        const scheduledDate = new Date(values.publish_date);
        scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If scheduled for future, set published to false
        if (scheduledDate > new Date()) {
          published = false;
          publishedAt = scheduledDate.toISOString();
        } else {
          // If scheduled for past/now, publish immediately
          published = true;
          publishedAt = scheduledDate.toISOString();
        }
      } else if (published) {
        // Immediate publish
        publishedAt = new Date().toISOString();
      }
      
      const postData = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        excerpt: values.excerpt,
        featured_image: values.featured_image,
        meta_image: values.meta_image,
        category_id: categoryId === "uncategorized" ? null : categoryId,
        published,
        published_at: publishedAt,
        ...(initialPost ? { id: initialPost.id } : {}),
        author_id: initialPost?.author_id || authorId,
      };

      await createOrUpdatePost(postData);
      
      toast.success(
        initialPost ? 'Blog post updated successfully!' : 'Blog post published successfully!'
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/blog-admin');
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter blog post title"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-generate slug on title change if not editing
                            if (!initialPost) {
                              generateSlug();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder="enter-slug-here"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSlug}
                        >
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary of the post"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featured_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          label="Featured Image"
                          recommendedWidth={1200}
                          recommendedHeight={900}
                          maxWidth={1200}
                          maxHeight={900}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meta_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          label="Social Share Image (OG Image)"
                          recommendedWidth={1200}
                          recommendedHeight={630}
                          maxWidth={1200}
                          maxHeight={630}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        If not set, the featured image will be used.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      value={categoryId} 
                      onValueChange={(value) => setCategoryId(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Publish Now
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value
                              ? "This post will be published immediately"
                              : "This post is saved as a draft"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue('scheduled_publish', false);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scheduled_publish"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Schedule Publish
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Set a specific date and time to publish
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue('published', false);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('scheduled_publish') && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <FormField
                        control={form.control}
                        name="publish_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Publish Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="publish_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publish Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value || '09:00'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Publishing...' : initialPost ? 'Update Post' : 'Create & Publish Post'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onCancel || (() => navigate('/blog-admin'))}
                  >
                    Cancel
                  </Button>
                </div>
                
                {initialPost && (
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>Created: {new Date(initialPost.created_at).toLocaleDateString()}</p>
                    {initialPost.updated_at && (
                      <p>Last updated: {new Date(initialPost.updated_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default BlogPostEditor;
