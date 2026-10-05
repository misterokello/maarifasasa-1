
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { useQuery } from '@tanstack/react-query';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const BlogEditorNew = () => {
  const navigate = useNavigate();
  
  // Check if the user is an admin
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isAdminAuthenticated,
  });
  
  // Redirect if not an admin
  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/learning');
    }
  }, [isAdmin, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout title="Create New Blog Post" subtitle="Write and publish a new blog post">
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
          <CardTitle className="text-2xl">Create New Blog Post</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogPostEditor />
        </CardContent>
      </Card>
    </AdminDashboardLayout>
  );
};

export default BlogEditorNew;
