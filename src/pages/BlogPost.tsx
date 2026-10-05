import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPostBySlug, fetchApprovedComments, submitComment, fetchRelatedPosts, type BlogComment } from '@/lib/api/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import BlogPostCard from '@/components/blog/BlogPostCard';
import SocialShare from '@/components/blog/SocialShare';
import { Helmet } from 'react-helmet';
import CommentItem from '@/components/blog/CommentItem';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-spam honeypot field
  const [submitting, setSubmitting] = useState(false);

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: async () => {
      const post = await fetchPostBySlug(slug!);
      
      // Increment view count when post is loaded (uses new daily tracking)
      if (post && post.published) {
        try {
          await supabase.rpc('increment_daily_post_views', { p_post_id: post.id });
        } catch (error) {
          console.error('Error incrementing view count:', error);
        }
      }
      
      return post;
    },
    enabled: !!slug,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['blogComments', post?.id],
    queryFn: () => fetchApprovedComments(post!.id),
    enabled: !!post?.id,
  });

  // Fetch related posts from the same category
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['relatedPosts', post?.category_id, post?.id],
    queryFn: async () => {
      if (!post?.category_id || !post?.id) return [];
      return await fetchRelatedPosts(post.category_id, post.id, 3);
    },
    enabled: !!post?.category_id && !!post?.id,
  });

  // Sanitize blog post content to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!post?.content) return '';
    
    return DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'code', 'pre',
        'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
        'width', 'height', 'frameborder', 'allowfullscreen'
      ],
      ADD_ATTR: ['target', 'rel']
    });
  }, [post?.content]);


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      console.log('Honeypot triggered - blocking spam submission');
      // Silently reject without notifying the bot
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setComment('');
        setName('');
        setEmail('');
        setHoneypot('');
      }, 2000);
      return;
    }
    
    if (!comment.trim() || !name.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    console.log('Starting comment submission...');
    setSubmitting(true);
    try {
      const newComment = {
        content: comment.trim(),
        post_id: post!.id,
        parent_id: null,
        author_name: name.trim(),
        author_email: email.trim(),
      };

      console.log('Comment data prepared:', newComment);
      const result = await submitComment(newComment);
      console.log('Submit result:', result);
      
      if (result) {
        toast.success(
          "Your comment has been submitted and is awaiting approval."
        );
        setComment('');
        setName('');
        setEmail('');
        setHoneypot('');
        refetchComments();
      } else {
        console.error('Submit returned null/undefined');
        toast.error("Failed to submit your comment. Please try again.");
      }
    } catch (error) {
      console.error('Caught error during submission:', error);
      toast.error("Failed to submit your comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string, replyName: string, replyEmail: string) => {
    try {
      const newReply = {
        content: content.trim(),
        post_id: post!.id,
        parent_id: parentId,
        author_name: replyName.trim(),
        author_email: replyEmail.trim(),
      };

      await submitComment(newReply);
      toast.success("Your reply has been submitted and is awaiting approval.");
      refetchComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error("Failed to submit your reply. Please try again.");
    }
  };

  if (postLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg mb-6"></div>
            <div className="w-full h-8 bg-gray-100 animate-pulse rounded mb-4"></div>
            <div className="w-2/3 h-6 bg-gray-100 animate-pulse rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-4 bg-gray-100 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const BASE_URL = "https://maarifasasa.com";
  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  // Ensure the OG image is an absolute URL for proper social sharing
  const getAbsoluteImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return `${BASE_URL}/og-image.png`;
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If relative URL, prepend origin
    return `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };
  // Use meta_image if set, otherwise fall back to featured_image
  const ogImage = getAbsoluteImageUrl(post.meta_image || post.featured_image);
  // Strip HTML/whitespace from content as a last-resort description fallback
  const contentFallback = post.content
    ? post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    : post.title;
  const description = (post.excerpt && post.excerpt.trim()) || contentFallback;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": description,
    "image": ogImage,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.published_at || post.created_at,
    "author": { "@type": "Organization", "name": "Maarifasasa" },
    "publisher": {
      "@type": "Organization",
      "name": "Maarifasasa",
      "logo": { "@type": "ImageObject", "url": `${BASE_URL}/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": postUrl }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <Helmet>
        <title>{post.title} | Blog</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={postUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Maarifasasa" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:alt" content={post.title} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {post.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={postUrl} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={post.title} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={post.featured_image} 
                alt={post.title} 
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Post Header */}
          <div className="mb-8">
            {post.category_name && (
              <Badge variant="secondary" className="mb-4">
                {post.category_name}
              </Badge>
            )}
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {post.published_at 
                ? format(new Date(post.published_at), 'MMMM d, yyyy') 
                : format(new Date(post.created_at), 'MMMM d, yyyy')}
            </div>
          </div>

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none mb-16 tiptap-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Social Share Section */}
          <div className="mb-12">
            <SocialShare 
              url={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-share/${post.slug}`}
              title={post.title}
              description={post.excerpt || undefined}
            />
          </div>

          {/* Comments Section */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>

            {/* Existing Comments */}
            {comments.length > 0 ? (
              <div className="space-y-6 mb-8">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-8">Be the first to leave a comment!</p>
            )}

            {/* Comment Form */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Leave a Comment</h3>
                <p className="text-sm text-muted-foreground">
                  Your comment will appear after approval
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitComment}>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Your comment"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Your email (not published)"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {/* Honeypot field - hidden from humans, visible to bots */}
                    <Input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={e => setHoneypot(e.target.value)}
                      className="absolute opacity-0 pointer-events-none"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Comment'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="border-t pt-12 mt-12">
              <h2 className="text-3xl font-bold mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
