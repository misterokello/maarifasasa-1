import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Function invoked with method:", req.method);
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if there are any existing admin users first
    const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .limit(1);
      
    if (adminCheckError) {
      console.error("Error checking existing admins:", adminCheckError);
      return new Response(JSON.stringify({ error: adminCheckError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isInitialSetup = existingAdmins?.length === 0;
    console.log("Is initial setup (no admins exist):", isInitialSetup);

    // If not initial setup, require authentication and admin role
    if (!isInitialSetup) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized - No authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create a client with the user's auth token to verify identity
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log("Authenticated user:", user.id);

      // Check if the caller is an admin using the has_role function
      const { data: isAdmin, error: roleError } = await supabaseClient.rpc('is_admin');
      
      if (roleError || !isAdmin) {
        console.error("Role check error:", roleError);
        return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log("Admin access verified for user:", user.id);
    }
    
    // Get the request body
    const { email, password, secret } = await req.json()
    
    console.log("Request received with email:", email);
    
    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Get the admin setup secret from environment variable
    const adminSecret = Deno.env.get('ADMIN_SETUP_SECRET') ?? ''
    
    console.log("Admin creation flow for:", email);
    
    // For initial setup, require a valid secret
    if (isInitialSetup && adminSecret && secret !== adminSecret) {
      console.log("Secret validation failed for initial setup");
      return new Response(JSON.stringify({ 
        error: 'Invalid secret',
        message: 'A valid setup secret is required for initial admin creation.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log("Proceeding with admin user creation");
    
    // Create a new user
    try {
      // Check if user already exists
      const { data: { users }, error: lookupError } = await supabaseAdmin.auth.admin.listUsers({
        filters: {
          email: email
        }
      });
      
      if (lookupError) {
        console.log("Error looking up user:", lookupError);
      }
      
      let userId;
      
      if (users && users.length > 0) {
        console.log("User already exists, using existing ID:", users[0].id);
        userId = users[0].id;
      } else {
        // Create the user with admin privileges
        console.log("Creating new user");
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });
        
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        userId = data.user.id;
        console.log("Created user with ID:", userId);
      }
      
      // Add user to admin_users table
      console.log("Adding user to admin_users table");
      const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .upsert({ user_id: userId, email: email });
      
      if (adminError) {
        console.error("Error adding to admin_users:", adminError);
        return new Response(JSON.stringify({ error: adminError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user created/updated successfully',
          userId: userId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error("Unexpected error creating user:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
