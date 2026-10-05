
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash, Check, X, FileText, FolderOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAllPosts, fetchCategories, deletePost, updatePostStatus } from '@/lib/api/blog';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import BlogCategoryEditor from '@/components/blog/BlogCategoryEditor';
import { formatDistanceToNow } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AdminBlog = () => {
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const navigate = useNavigate();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isAdminAuthenticated,
  });

  const { 
    data: posts = [], 
    isLoading: postsLoading,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['allBlogPosts'],
    queryFn: fetchAllPosts,
    enabled: !!isAdmin,
  });

  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: fetchCategories,
    enabled: !!isAdmin,
  });

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowPostEditor(true);
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setShowPostEditor(true);
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(id);
        toast.success('Post deleted successfully');
        refetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
      }
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      const newStatus = !post.published;
      await updatePostStatus(post.id, newStatus);
      toast.success(newStatus ? 'Post published successfully' : 'Post unpublished');
      refetchPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Failed to update post status');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryEditor(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowCategoryEditor(true);
  };

  const handleCancelEdit = () => {
    setShowPostEditor(false);
    setShowCategoryEditor(false);
    setEditingPost(null);
    setEditingCategory(null);
  };

  const handleSaveSuccess = () => {
    setShowPostEditor(false);
    setShowCategoryEditor(false);
    setEditingPost(null);
    setEditingCategory(null);
    refetchPosts();
    refetchCategories();
  };

  if (!isAdminLoading && !isAdmin) {
    navigate('/learning');
    return null;
  }

  if (isAdminLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {showPostEditor ? (
          <>
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleCancelEdit} 
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog Management
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <Link to="/super-admin-dashboard">Dashboard</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <Link to="/blog-admin">Blog Management</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{editingPost ? 'Edit Post' : 'New Post'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <BlogPostEditor 
              initialPost={editingPost}
              onCancel={handleCancelEdit}
              onSuccess={handleSaveSuccess} 
            />
          </>
        ) : showCategoryEditor ? (
          <>
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleCancelEdit} 
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog Management
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <Link to="/super-admin-dashboard">Dashboard</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <Link to="/blog-admin">Blog Management</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{editingCategory ? 'Edit Category' : 'New Category'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <BlogCategoryEditor
              initialCategory={editingCategory}
              onCancel={handleCancelEdit}
              onSuccess={handleSaveSuccess}
            />
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center mb-4">
                <Button asChild variant="ghost" className="mr-4">
                  <Link to="/super-admin-dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <CardTitle className="text-2xl">Blog Management</CardTitle>
                  <CardDescription>
                    Manage your blog posts and categories
                  </CardDescription>
                </div>
              </div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <Link to="/super-admin-dashboard">Dashboard</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Blog Management</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="posts" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="flex items-center">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Categories
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                  <div className="mb-4 flex justify-end">
                    <Button onClick={handleNewPost}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                  </div>
                  
                  {postsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : posts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {posts.map((post) => (
                            <TableRow key={post.id}>
                              <TableCell>{post.title}</TableCell>
                              <TableCell>
                                {post.published ? (
                                  <Badge>Published</Badge>
                                ) : (
                                  <Badge variant="outline">Draft</Badge>
                                )}
                              </TableCell>
                              <TableCell>{post.category_name || 'Uncategorized'}</TableCell>
                              <TableCell>
                                {post.published_at 
                                  ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                  : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleTogglePublish(post)}
                                >
                                  {post.published ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditPost(post)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No posts found</p>
                      <Button onClick={handleNewPost}>Create your first post</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="categories">
                  <div className="mb-4 flex justify-end">
                    <Button onClick={handleNewCategory}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Category
                    </Button>
                  </div>
                  
                  {categoriesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : categories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell>{category.name}</TableCell>
                              <TableCell>{category.slug}</TableCell>
                              <TableCell>{category.description || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No categories found</p>
                      <Button onClick={handleNewCategory}>Create your first category</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminBlog;
