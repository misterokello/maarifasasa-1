// Edge function that returns prerendered HTML with OG/Twitter meta tags for a
// single blog post. Designed to be the URL shared on WhatsApp/LinkedIn/X so
// non-JS social crawlers see correct previews. Human visitors are redirected
// to the real /blog/:slug route via meta refresh + JS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BASE_URL = "https://maarifasasa.com";
const FALLBACK_IMAGE = `${BASE_URL}/og-image.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteImageUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function renderHtml(post: {
  title: string;
  slug: string;
  description: string;
  image: string;
  publishedAt: string | null;
  updatedAt: string | null;
}): string {
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);
  const image = escapeHtml(post.image);
  const url = escapeHtml(canonical);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Maarifasasa",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png`,
      },
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | Maarifasasa</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Maarifasasa" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    ${post.publishedAt ? `<meta property="article:published_time" content="${escapeHtml(post.publishedAt)}" />` : ""}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${title}" />

    <script type="application/ld+json">${JSON.stringify(article)}</script>

    <meta http-equiv="refresh" content="0; url=${url}" />
    <script>window.location.replace(${JSON.stringify(canonical)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${url}">${title}</a>…</p>
  </body>
</html>`;
}

function notFoundHtml(slug: string): string {
  const home = `${BASE_URL}/blog`;
  return `<!doctype html><html><head><meta charset="UTF-8" /><title>Post not found | Maarifasasa</title><meta http-equiv="refresh" content="0; url=${home}" /></head><body><p>Post "${escapeHtml(slug)}" not found. <a href="${home}">Back to blog</a>.</p></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Path looks like /blog-share/<slug> or /functions/v1/blog-share/<slug>
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("blog-share");
    const slug = (idx >= 0 ? parts[idx + 1] : parts[parts.length - 1]) || "";

    if (!slug) {
      return new Response(notFoundHtml(""), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, content, featured_image, meta_image, published, published_at, updated_at"
      )
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) {
      return new Response(notFoundHtml(slug), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const contentFallback = data.content
      ? stripHtml(data.content).slice(0, 160)
      : data.title;
    const description =
      (data.excerpt && data.excerpt.trim()) || contentFallback || data.title;

    const html = renderHtml({
      title: data.title,
      slug: data.slug,
      description,
      image: absoluteImageUrl(data.meta_image || data.featured_image),
      publishedAt: data.published_at,
      updatedAt: data.updated_at,
    });

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("blog-share error", err);
    return new Response(notFoundHtml(""), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});