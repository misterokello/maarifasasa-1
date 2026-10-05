
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '@/lib/api/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 rounded-3xl border-0 shadow-lg h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        {post.featured_image && (
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src={post.featured_image} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
            />
          </div>
        )}
        
        <CardContent className="p-6">
          {post.category_name && (
            <Badge variant="secondary" className="mb-3 text-xs">
              {post.category_name}
            </Badge>
          )}
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {post.excerpt || post.content.substring(0, 100) + '...'}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex-shrink-0" />
            <span className="font-medium">Admin</span>
            <span>•</span>
            <span>
              {post.published_at ? 
                formatDistanceToNow(new Date(post.published_at), { addSuffix: true }) : 
                formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogPostCard;
