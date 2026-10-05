import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogComment } from '@/lib/api/blog';

interface CommentItemProps {
  comment: BlogComment;
  onReply: (parentId: string, content: string, name: string, email: string) => Promise<void>;
  depth?: number;
}

const CommentItem = ({ comment, onReply, depth = 0 }: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyName, setReplyName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !replyName.trim() || !replyEmail.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent, replyName, replyEmail);
      setReplyContent('');
      setReplyName('');
      setReplyEmail('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Limit nesting depth to avoid excessive indentation
  const maxDepth = 3;
  const isMaxDepth = depth >= maxDepth;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className="text-sm mt-2">{comment.content}</p>
          
          {!isMaxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}

          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-4 space-y-3">
              <Input
                type="text"
                placeholder="Your name"
                value={replyName}
                onChange={(e) => setReplyName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Your email (won't be published)"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
                required
              />
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Reply'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
