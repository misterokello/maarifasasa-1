import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
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
import { 
  PlusCircle, 
  Edit, 
  Trash, 
  Check, 
  X, 
  FileText, 
  FolderOpen, 
  MessageSquare,
  ExternalLink,
  Eye,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  fetchAllPosts, 
  fetchCategories, 
  deletePost, 
  updatePostStatus,
  fetchAllComments,
  updateCommentApproval,
  deleteComment,
  createOrUpdateCategory,
  deleteCategory,
  type BlogCategory
} from '@/lib/api/blog';
import { formatDistanceToNow, format, isSameDay, subDays, startOfDay, isWithinInterval } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import slugify from 'slugify';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';
import StatsCard from '@/components/admin/StatsCard';

const BlogAdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || 'posts');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>();
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Sync tab with URL params
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "posts") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  // Fetch posts
  const { 
    data: posts = [], 
    isLoading: postsLoading,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['allBlogPosts'],
    queryFn: fetchAllPosts,
  });

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: fetchCategories,
  });

  // Fetch comments
  const { 
    data: comments = [], 
    isLoading: commentsLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['allBlogComments'],
    queryFn: fetchAllComments,
  });

  // Post handlers
  const handleTogglePublish = async (post: any) => {
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

  const handleDeletePost = async (id: string) => {
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

  // Comment handlers
  const handleApproveComment = async (id: string, approve: boolean) => {
    try {
      await updateCommentApproval(id, approve);
      toast.success(approve ? 'Comment approved' : 'Comment rejected');
      refetchComments();
    } catch (error) {
      console.error('Error updating comment approval:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      try {
        await deleteComment(id);
        toast.success('Comment deleted successfully');
        refetchComments();
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('Failed to delete comment');
      }
    }
  };

  // Category handlers
  const handleOpenCategoryDialog = (category?: BlogCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategorySlug(category.slug);
      setCategoryDescription(category.description || '');
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategorySlug('');
      setCategoryDescription('');
    }
    setCategoryDialogOpen(true);
  };

  const handleCategoryNameChange = (value: string) => {
    setCategoryName(value);
    if (!editingCategory) {
      setCategorySlug(slugify(value, { lower: true, strict: true }));
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryName.trim() || !categorySlug.trim()) {
        toast.error('Category name and slug are required');
        return;
      }

      await createOrUpdateCategory({
        id: editingCategory?.id,
        name: categoryName,
        slug: categorySlug,
        description: categoryDescription,
      });

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setCategoryDialogOpen(false);
      refetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Posts in this category will become uncategorized.')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted successfully');
        refetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleOpenPreview = (post: any) => {
    setPreviewPost(post);
    setPreviewDialogOpen(true);
  };

  // Sanitize preview content
  const sanitizedPreviewContent = useMemo(() => {
    if (!previewPost?.content) return '';
    
    return DOMPurify.sanitize(previewPost.content, {
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
  }, [previewPost?.content]);

  // Calculate analytics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.published).length;
  const draftPosts = posts.filter(p => !p.published).length;
  const scheduledPosts = posts.filter(p => 
    !p.published && p.published_at && new Date(p.published_at) > new Date()
  );
  const pendingComments = comments.filter(c => !c.approved).length;
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const topPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // Get posts for selected calendar date
  const postsForSelectedDate = selectedCalendarDate
    ? scheduledPosts.filter(post => 
        post.published_at && isSameDay(new Date(post.published_at), selectedCalendarDate)
      )
    : [];

  // Get all dates with scheduled posts
  const datesWithScheduledPosts = scheduledPosts
    .filter(p => p.published_at)
    .map(p => new Date(p.published_at!));

  // Calculate trend data for the last 7 days
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      const dateStr = format(date, 'MMM dd');
      
      // Count posts published on this day
      const postsPublishedOnDay = posts.filter(post => 
        post.published && 
        post.published_at && 
        isSameDay(new Date(post.published_at), date)
      ).length;

      // Count comments created on this day
      const commentsOnDay = comments.filter(comment => 
        isSameDay(new Date(comment.created_at), date)
      ).length;

      // Sum views for posts published on this day
      const viewsOnDay = posts
        .filter(post => 
          post.published && 
          post.published_at && 
          isSameDay(new Date(post.published_at), date)
        )
        .reduce((sum, post) => sum + (post.views || 0), 0);

      return {
        date: dateStr,
        posts: postsPublishedOnDay,
        comments: commentsOnDay,
        views: viewsOnDay,
      };
    });

    return last7Days;
  }, [posts, comments]);

  return (
    <AdminDashboardLayout 
      title="Blog Dashboard" 
      subtitle="Manage your blog posts, categories, and comments"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard
          title="Total Posts"
          value={`${publishedPosts}/${totalPosts}`}
          icon={<FileText className="h-6 w-6 text-blue-500" />}
          iconBgColor="bg-blue-500/10"
        />
        <StatsCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={<Eye className="h-6 w-6 text-purple-500" />}
          iconBgColor="bg-purple-500/10"
        />
        <StatsCard
          title="Avg Views/Post"
          value={publishedPosts > 0 ? Math.round(totalViews / publishedPosts).toLocaleString() : 0}
          icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
          iconBgColor="bg-emerald-500/10"
        />
        <StatsCard
          title="Pending Comments"
          value={pendingComments}
          icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
          iconBgColor="bg-amber-500/10"
        />
        <StatsCard
          title="Scheduled Posts"
          value={scheduledPosts.length}
          icon={<Clock className="h-6 w-6 text-cyan-500" />}
          iconBgColor="bg-cyan-500/10"
        />
      </div>
        {/* Trends Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              7-Day Activity Trends
            </CardTitle>
            <CardDescription>Posts published, comments received, and views over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="posts" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Posts Published"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="comments" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Comments"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Views"
                  dot={{ fill: 'hsl(var(--chart-3))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Posts by Views */}
        {topPosts.length > 0 && topPosts.some(p => (p.views || 0) > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Top Posts by Views</CardTitle>
              <CardDescription>Most viewed blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPosts.filter(p => (p.views || 0) > 0).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <Link 
                          to={`/blog/${post.slug}`}
                          className="font-medium hover:underline"
                        >
                          {post.title}
                        </Link>
                        {!post.published && (
                          <Badge variant="outline" className="ml-2">Draft</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{(post.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Blog Management Dashboard</CardTitle>
            <CardDescription>
              Manage blog posts, categories, and comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="posts" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Posts ({posts.length})
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule ({scheduledPosts.length})
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Categories ({categories.length})
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments ({comments.filter(c => !c.approved).length} pending)
                </TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts">
                <div className="mb-4 flex justify-end">
                  <Button asChild>
                    <Link to="/blog-editor/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Post
                    </Link>
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
                          <TableHead>Views</TableHead>
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
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span>{(post.views || 0).toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.published_at 
                                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenPreview(post)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleTogglePublish(post)}
                              >
                                {post.published ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link to={`/blog-editor/edit/${post.slug}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
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
                    <Button asChild>
                      <Link to="/blog-editor/new">Create your first post</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Scheduled Posts Calendar</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Click on dates with scheduled posts to view details
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedCalendarDate}
                      onSelect={(date) => {
                        setSelectedCalendarDate(date);
                        if (date) {
                          const hasPostsOnDate = scheduledPosts.some(
                            p => p.published_at && isSameDay(new Date(p.published_at), date)
                          );
                          if (hasPostsOnDate) {
                            setCalendarDialogOpen(true);
                          }
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-md border pointer-events-auto"
                      modifiers={{
                        scheduled: datesWithScheduledPosts,
                      }}
                      modifiersClassNames={{
                        scheduled: "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground",
                      }}
                    />
                  </div>

                  {scheduledPosts.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-md font-semibold mb-4">Upcoming Scheduled Posts</h4>
                      <div className="space-y-3">
                        {scheduledPosts
                          .sort((a, b) => 
                            new Date(a.published_at!).getTime() - new Date(b.published_at!).getTime()
                          )
                          .map((post) => (
                            <Card key={post.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium mb-1">{post.title}</h5>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          {format(new Date(post.published_at!), 'PPP')} at{' '}
                                          {format(new Date(post.published_at!), 'p')}
                                        </span>
                                      </div>
                                      {post.category_name && (
                                        <Badge variant="outline" className="text-xs">
                                          {post.category_name}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <Link to={`/blog-editor/edit/${post.slug}`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeletePost(post.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}

                  {scheduledPosts.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No scheduled posts</p>
                      <Button asChild>
                        <Link to="/blog-editor/new">Schedule your first post</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Dialog for posts on selected date */}
              <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Scheduled Posts for {selectedCalendarDate && format(selectedCalendarDate, 'PPP')}
                    </DialogTitle>
                    <DialogDescription>
                      Posts scheduled to publish on this date
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {postsForSelectedDate.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h5 className="font-medium">{post.title}</h5>
                              <Badge variant="outline">
                                {format(new Date(post.published_at!), 'p')}
                              </Badge>
                            </div>
                            {post.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1"
                              >
                                <Link to={`/blog-editor/edit/${post.slug}`}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleDeletePost(post.id);
                                  setCalendarDialogOpen(false);
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Categories Tab */}
              <TabsContent value="categories">
                <div className="mb-4 flex justify-end">
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenCategoryDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                        <DialogDescription>
                          {editingCategory ? 'Update category details below.' : 'Add a new blog category.'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category-name">Name</Label>
                          <Input
                            id="category-name"
                            value={categoryName}
                            onChange={(e) => handleCategoryNameChange(e.target.value)}
                            placeholder="Category name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category-slug">Slug</Label>
                          <Input
                            id="category-slug"
                            value={categorySlug}
                            onChange={(e) => setCategorySlug(e.target.value)}
                            placeholder="category-slug"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category-description">Description</Label>
                          <Textarea
                            id="category-description"
                            value={categoryDescription}
                            onChange={(e) => setCategoryDescription(e.target.value)}
                            placeholder="Category description (optional)"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveCategory}>
                            {editingCategory ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenCategoryDialog(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteCategory(category.id)}
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
                    <p className="text-muted-foreground">No categories found</p>
                  </div>
                )}
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments">
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Comment</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Post</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comments.map((comment) => (
                          <TableRow key={comment.id}>
                            <TableCell className="max-w-xs truncate">
                              {comment.content}
                            </TableCell>
                            <TableCell>
                              {comment.author_name || 'Anonymous'}
                              {comment.author_email && (
                                <div className="text-xs text-muted-foreground">
                                  {comment.author_email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link
                                to={`/blog/${comment.blog_posts.slug}`}
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                {comment.blog_posts.title.length > 30 
                                  ? comment.blog_posts.title.substring(0, 30) + '...' 
                                  : comment.blog_posts.title}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              {comment.approved ? (
                                <Badge>Approved</Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {!comment.approved && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleApproveComment(comment.id, true)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {comment.approved && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleApproveComment(comment.id, false)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteComment(comment.id)}
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
                    <p className="text-muted-foreground">No comments yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Preview</DialogTitle>
              <DialogDescription>
                This is how your post will appear to readers
              </DialogDescription>
            </DialogHeader>
            {previewPost && (
              <div className="mt-4">
                {/* Featured Image */}
                {previewPost.featured_image && (
                  <div className="mb-8 rounded-lg overflow-hidden">
                    <img 
                      src={previewPost.featured_image} 
                      alt={previewPost.title} 
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Post Header */}
                <div className="mb-8">
                  {previewPost.category_name && (
                    <Badge variant="secondary" className="mb-4">
                      {previewPost.category_name}
                    </Badge>
                  )}
                  <h1 className="text-4xl font-bold mb-4">{previewPost.title}</h1>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {previewPost.published_at 
                      ? format(new Date(previewPost.published_at), 'MMMM d, yyyy') 
                      : format(new Date(previewPost.created_at), 'MMMM d, yyyy')}
                  </div>
                </div>

                {/* Post Content */}
                <div 
                  className="prose prose-lg max-w-none tiptap-content"
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewContent }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
    </AdminDashboardLayout>
  );
};

export default BlogAdminDashboard;
