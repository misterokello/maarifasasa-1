
## Technical approach

**Data (live, no schema change)**

- New hook `src/hooks/useHomepageContent.ts` — React Query, `staleTime: 5 min`:
  - featured courses: active `products` in `certificate` + `program`, newest first, capped at 8
  - upcoming cohorts: active `bootcamp` products with `start_date >= today`, ascending; falls back to newest bootcamps when none are dated
- Reuses the existing `products` read policy and `src/lib/currencyFormat.ts` for UGX/USD display.
- Every course card links to `/checkout?product={slug}` with the standard label "Start Learning to Earn"; instalment-eligible bootcamps show the 50% note.

**Components (new, in `src/components/home/`)**

- `HomeHero.tsx` — replaces the current hero copy with the deck positioning, dual CTA, stat chips
- `AudienceSplit.tsx` — the two-door selector
- `ImpactStats.tsx` — count-up on scroll via IntersectionObserver
- `PathwayStepper.tsx` — three moves, auto-advance with hover/click pause
- `FeaturedCoursesCarousel.tsx` and `UpcomingCohortsCarousel.tsx` — built on the existing shadcn `carousel` (embla) with autoplay, drag on mobile, arrows on desktop, skeletons while loading, section hidden when empty
- `SkillsDomains.tsx` — the 8 demand domains
- `StoriesCarousel.tsx` — wraps existing `SuccessStory`
- `EnterpriseBand.tsx` — employer/funder/government/investor doors
- `StickyMobileCta.tsx` — slides up after the hero leaves the viewport

`src/pages/Index.tsx` becomes a thin composition of these, keeping and updating its Helmet SEO and Organization JSON-LD (adding the deck's mission wording, `foundingLocation`, and an `ItemList` of featured courses).

**Design**

- Existing semantic tokens only (`--primary` violet, `--accent` teal, `--muted`, gradients from `index.css`); no hardcoded colour utilities. Reuses `TrustedBySection`.
- Motion via existing Tailwind keyframes plus small IntersectionObserver reveals — no new animation dependency. `prefers-reduced-motion` disables autoplay and reveals.
- Mobile-first: single-column stacking, swipeable carousels, 44px tap targets, `loading="lazy"` on all non-hero images.

**Copy source**
All headline, mission, proof and audience wording is taken from the uploaded master presentation: the 1,000,000-by-2030 mission, "outcomes, not promises", 10,000+ trained, ~2,000 verified placements, UGX 1.2B generated annually, and the Mastercard Foundation EdTech Fellowship (delivered in Uganda by Hive Colab) validation.

**Out of scope**
No backend, checkout, admin or routing changes. Other pages keep their current design.