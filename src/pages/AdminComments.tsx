
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Check, Trash, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fetchAllComments, updateCommentApproval, deleteComment } from '@/lib/api/blog';
import { isAdminAuthenticated } from '@/lib/adminAuth';

const AdminComments = () => {
  const navigate = useNavigate();

  // Check admin status
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isAdminAuthenticated,
  });

  // Fetch all comments
  const { 
    data: comments = [], 
    isLoading: commentsLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['allBlogComments'],
    queryFn: fetchAllComments,
    enabled: !!isAdmin,
  });

  // Handle approving or rejecting a comment
  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await updateCommentApproval(id, approve);
      toast.success(approve ? 'Comment approved' : 'Comment rejected');
      refetchComments();
    } catch (error) {
      console.error('Error updating comment approval:', error);
      toast.error('Failed to update comment');
    }
  };

  // Handle deleting a comment
  const handleDelete = async (id: string) => {
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

  // If not admin, redirect to courses
  if (!isAdminLoading && !isAdmin) {
    navigate('/learning');
    return null;
  }

  // If checking admin status
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Comment Management</CardTitle>
            <CardDescription>
              Approve, reject, or delete comments from your blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                              onClick={() => handleApprove(comment.id, true)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {comment.approved && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleApprove(comment.id, false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(comment.id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminComments;
