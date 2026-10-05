# Fix Thinkific one-tap course launch (404 on sign-in link)

## What is confirmed

`thinkific-launch` (and the same helper in `thinkific-user-provision` / `thinkific-enrollment`) calls
`GET https://api.thinkific.com/api/public/v1/users/{id}/sign_in_url`. The response is Thinkific's
site 404 HTML page, so no express sign-in URL is ever minted. Two possible causes, both requiring
config we cannot read from code:

1. That endpoint is not available on this Thinkific plan / API version (express sign-in URLs are a
   plan-gated feature), or
2. the stored `thinkific_user_id` values point at a different Thinkific site than the API token.

Learners are not hard-blocked today: the function falls back to the course URL or the Thinkific
sign-in page, so they must sign in manually. The log noise is real; the "no URL returned" path is not.

## Proposed work

1. Add a diagnostic step: call `GET /users/{id}` with the same token before minting the link. If the
   user fetch succeeds but `sign_in_url` 404s, the endpoint is unavailable — log once, stop retrying,
   and skip the call site-wide via a cached flag.
2. Implement real SSO as the primary path using Thinkific SSO (signed JWT):
   - Store a new secret `THINKIFIC_SSO_API_KEY`.
   - Build `https://maarifasasa.thinkific.com/api/sso/v2/login?jwt=<signed>&return_to=<course_url>`
     with an HS256 JWT (`email`, `first_name`, `last_name`, `iat`, optional `external_id`).
   - Reuse this in `thinkific-launch`; keep the existing fallback chain unchanged.
3. Re-point the profile self-heal path: if `GET /users/{id}` returns 404, clear
   `profiles.thinkific_user_id` and re-provision on the next launch so stale IDs heal automatically.
4. Reduce log noise: log the 404 body only once per function instance.

## What is needed from you

The Thinkific SSO API key (found in Thinkific under Settings → Code & Analytics → SSO). Without it,
step 2 cannot be built and we can only implement steps 1, 3 and 4 (self-healing plus quieter logs,
with learners still signing in manually once).
