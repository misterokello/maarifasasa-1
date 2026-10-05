import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Authentication check - require service role key or cron secret
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // Check if called by authorized source (service role key or cron secret)
    const isAuthorizedByServiceKey = authHeader === `Bearer ${supabaseServiceKey}`;
    const isAuthorizedByCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    if (!isAuthorizedByServiceKey && !isAuthorizedByCronSecret) {
      console.error('Unauthorized access attempt to auto-publish-scheduled-posts');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all posts that are scheduled to be published (published=false, published_at <= now)
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, published_at')
      .eq('published', false)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${scheduledPosts?.length || 0} posts to publish`);

    // Update all scheduled posts to published
    if (scheduledPosts && scheduledPosts.length > 0) {
      const postIds = scheduledPosts.map(post => post.id);
      
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ published: true })
        .in('id', postIds);

      if (updateError) {
        console.error('Error updating posts:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Successfully published ${postIds.length} posts`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publishedCount: scheduledPosts?.length || 0,
        posts: scheduledPosts?.map(p => ({ id: p.id, title: p.title })) || []
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
