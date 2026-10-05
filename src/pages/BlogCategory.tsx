import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPostsByCategory, fetchCategories } from '@/lib/api/blog';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const BlogCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['blogPostsByCategory', slug],
    queryFn: () => fetchPostsByCategory(slug!),
    enabled: !!slug,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: fetchCategories,
  });

  const category = categories.find(cat => cat.slug === slug);

  const filteredPosts = posts.filter(post => 
    searchQuery === '' || 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [featuredPost, ...restPosts] = filteredPosts;

  return (
    <div className="min-h-screen pt-16 pb-16">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-8 left-1/4 w-16 h-16 border-4 border-orange-400 rounded-full opacity-60" />
        <div className="absolute top-12 right-1/4 w-12 h-12 border-4 border-yellow-400 rounded-full opacity-60" />
        <div className="absolute bottom-8 left-1/3 w-8 h-8 bg-orange-400 rounded-full opacity-40" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Button variant="ghost" className="mb-6 text-white hover:text-white hover:bg-white/20" asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to all posts
              </Link>
            </Button>

            <div className="relative inline-block mb-4">
              <h1 className="text-5xl font-bold text-white mb-2">
                {category ? category.name : slug}
              </h1>
              <svg className="absolute -bottom-4 left-1/2 transform -translate-x-1/2" width="120" height="30" viewBox="0 0 120 30" fill="none">
                <path d="M2 15 Q 30 5, 60 15 T 118 15" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            {category?.description && (
              <p className="text-white/90 text-lg mb-8">{category.description}</p>
            )}
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mt-12">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-white rounded-2xl shadow-lg border-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Categories filter */}
        <div className="mb-12 flex justify-center flex-wrap gap-3">
          <Link to="/blog">
            <Badge className="px-6 py-2.5 text-base rounded-full border-0 transition-all bg-muted text-muted-foreground hover:bg-accent">
              All
            </Badge>
          </Link>
          {categories.map(category => (
            <Link key={category.id} to={`/blog/category/${category.slug}`}>
              <Badge className={`px-6 py-2.5 text-base rounded-full border-0 transition-all ${
                category.slug === slug
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}>
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Posts */}
        {postsLoading ? (
          <div className="space-y-8">
            <div className="aspect-[2/1] bg-muted animate-pulse rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Post */}
            {featuredPost && (
              <Link to={`/blog/${featuredPost.slug}`} className="block group">
                <Card className="overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      {featuredPost.featured_image && (
                        <div className="aspect-video md:aspect-square overflow-hidden bg-gradient-to-br from-purple-200 to-blue-200">
                          <img 
                            src={featuredPost.featured_image} 
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-8 md:p-12 flex flex-col justify-center">
                        {featuredPost.category_name && (
                          <Badge variant="secondary" className="mb-4 w-fit text-sm">
                            {featuredPost.category_name}
                          </Badge>
                        )}
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2">
                          {featuredPost.title}
                        </h2>
                        <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
                          {featuredPost.excerpt || featuredPost.content.substring(0, 200) + '...'}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500" />
                            <span className="font-medium">Admin</span>
                          </div>
                          <span>•</span>
                          <span>
                            {featuredPost.published_at ? 
                              formatDistanceToNow(new Date(featuredPost.published_at), { addSuffix: true }) : 
                              formatDistanceToNow(new Date(featuredPost.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Rest of Posts Grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Check out other categories or check back soon'}
            </p>
            <Button asChild>
              <Link to="/blog">View All Posts</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCategory;
