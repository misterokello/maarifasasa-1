
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPostBySlug } from '@/lib/api/blog';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { useQuery } from '@tanstack/react-query';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const BlogEditorEdit = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if the user is an admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isAdminAuthenticated,
  });
  
  // Fetch the blog post
  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        navigate('/blog-admin');
        return;
      }
      
      try {
        const post = await fetchPostBySlug(slug);
        if (!post) {
          navigate('/blog-admin');
          return;
        }
        
        setBlogPost(post);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        navigate('/blog-admin');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [slug, navigate]);
  
  // Redirect if not an admin
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      navigate('/learning');
    }
  }, [isAdmin, isAdminLoading, navigate]);
  
  if (isAdminLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout title="Edit Blog Post" subtitle="Update an existing blog post">
      <div className="mb-4 flex items-center">
        <Button asChild variant="ghost" className="mr-2">
          <Link to="/blog-admin">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog Management
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Blog Post</CardTitle>
        </CardHeader>
        <CardContent>
          {blogPost && <BlogPostEditor initialPost={blogPost} />}
        </CardContent>
      </Card>
    </AdminDashboardLayout>
  );
};

export default BlogEditorEdit;
