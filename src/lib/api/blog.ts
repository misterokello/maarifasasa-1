
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  meta_image: string | null;
  published: boolean;
  published_at: string | null;
  category_id: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  views?: number;
  // Joined fields
  category_name?: string;
};

type BlogComment = {
  id: string;
  content: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  approved: boolean;
  created_at: string;
  replies?: BlogComment[];
};

// Fetch all blog posts (for admin interface)
export async function fetchAllPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all blog posts:', error);
    return [];
  }

  return data.map(post => ({
    ...post,
    category_name: post.blog_categories?.name
  })) as BlogPost[];
}

// Fetch all published blog posts
export async function fetchPublishedPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories(name)
    `)
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }

  return data.map(post => ({
    ...post,
    category_name: post.blog_categories?.name
  })) as BlogPost[];
}

// Fetch a single blog post by slug
export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories(name)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return null;
  }

  return {
    ...data,
    category_name: data.blog_categories?.name
  } as BlogPost;
}

// Fetch all blog categories
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }

  return data as BlogCategory[];
}

// Fetch posts by category slug
export async function fetchPostsByCategory(categorySlug: string) {
  const { data: category, error: categoryError } = await supabase
    .from('blog_categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (categoryError || !category) {
    console.error(`Error fetching category with slug ${categorySlug}:`, categoryError);
    return [];
  }

  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories(name)
    `)
    .eq('category_id', category.id)
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (postsError) {
    console.error(`Error fetching posts for category ${categorySlug}:`, postsError);
    return [];
  }

  return posts.map(post => ({
    ...post,
    category_name: post.blog_categories?.name
  })) as BlogPost[];
}

// Fetch related posts by category ID (excluding current post)
export async function fetchRelatedPosts(categoryId: string, currentPostId: string, limit: number = 3) {
  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories(name)
    `)
    .eq('category_id', categoryId)
    .eq('published', true)
    .neq('id', currentPostId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (postsError) {
    console.error(`Error fetching related posts:`, postsError);
    return [];
  }

  return posts.map(post => ({
    ...post,
    category_name: post.blog_categories?.name
  })) as BlogPost[];
}

// Create or update a blog post
export async function createOrUpdatePost(post: Partial<BlogPost> & { author_id: string, title: string, slug: string, content: string }) {
  const isUpdating = !!post.id;
  const now = new Date().toISOString();
  
  // Remove scheduling fields from the database update
  const { scheduled_publish, publish_date, publish_time, ...postDataToSave } = post as any;
  
  const postData = {
    ...postDataToSave,
    updated_at: now,
  };

  const { data, error } = isUpdating 
    ? await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', post.id!)
        .select()
        .single()
    : await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

  if (error) {
    console.error('Error saving blog post:', error);
    throw error;
  }

  return data as BlogPost;
}

// Create or update a blog category
export async function createOrUpdateCategory(category: Partial<BlogCategory> & { name: string, slug: string }) {
  const isUpdating = !!category.id;

  const { data, error } = isUpdating 
    ? await supabase
        .from('blog_categories')
        .update(category)
        .eq('id', category.id!)
        .select()
        .single()
    : await supabase
        .from('blog_categories')
        .insert(category)
        .select()
        .single();

  if (error) {
    console.error('Error saving blog category:', error);
    throw error;
  }

  return data as BlogCategory;
}

// Delete a blog category
export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog category:', error);
    throw error;
  }

  return true;
}

// Delete a blog post
export async function deletePost(id: string) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }

  return true;
}

// Update post status (publish/unpublish)
export async function updatePostStatus(id: string, published: boolean) {
  const now = new Date().toISOString();
  const updates = {
    published,
    published_at: published ? now : null,
    updated_at: now,
  };

  const { error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating blog post status:', error);
    throw error;
  }

  return true;
}

// Fetch approved comments for a post using secure view (excludes email)
export async function fetchApprovedComments(postId: string) {
  // Use the public_blog_comments view which excludes author_email for security
  const { data, error } = await supabase
    .from('public_blog_comments')
    .select('id, post_id, parent_id, author_name, content, approved, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return [];
  }

  // Organize comments into a tree structure
  const comments = data as BlogComment[];
  const commentMap = new Map<string, BlogComment>();
  const rootComments: BlogComment[] = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies!.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

// Fetch all comments (for admin)
export async function fetchAllComments() {
  const { data, error } = await supabase
    .from('blog_comments')
    .select(`
      *,
      blog_posts(title, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all comments:', error);
    return [];
  }

  return data as (BlogComment & { blog_posts: { title: string, slug: string } })[];
}

// Approve or reject a comment
export async function updateCommentApproval(id: string, approved: boolean) {
  const { error } = await supabase
    .from('blog_comments')
    .update({ approved })
    .eq('id', id);

  if (error) {
    console.error('Error updating comment approval:', error);
    throw error;
  }

  return true;
}

// Submit a comment
export async function submitComment(comment: Omit<BlogComment, 'id' | 'approved' | 'created_at' | 'replies'>) {
  console.log('Submitting comment:', comment);
  
  const { data, error } = await supabase
    .from('blog_comments')
    .insert({
      content: comment.content,
      post_id: comment.post_id,
      parent_id: comment.parent_id || null,
      author_name: comment.author_name,
      author_email: comment.author_email,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting comment:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('Comment submitted successfully:', data);
  return data as BlogComment;
}

// Delete a comment
export async function deleteComment(id: string) {
  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }

  return true;
}

export type { BlogCategory, BlogPost, BlogComment };
