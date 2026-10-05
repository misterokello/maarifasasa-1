# Discount Codes & Referral Tracking Module

A standalone discount-code system that doubles as lead-source tracking. Each code belongs to a referrer (staff, learner, or influencer), carries a unique share link plus QR code, applies a percentage discount to selected courses, and feeds a leaderboard with signups, paid orders, revenue and commission.

## What gets built

### 1. Referrer onboarding
- Admin creates a code directly and assigns it to an existing profile, or
- Admin shares a public invite link. Applicants fill a short public form (name, email, phone, audience/channel, motivation).
- Applications land in a pending queue. On admin approval, the system generates the code, the share link (`/?dc=CODE`), and a QR code image. Declined applications get a reason field.
- Approved referrers get a portal page showing their code, link, QR download, and their own stats.

### 2. Code configuration (admin)
- Percentage discount (1–100), optional max redemptions, optional start/end dates, active toggle.
- Commission percentage per code (paid on the discounted order value).
- Course scoping: pick which products the code applies to (certificates, bootcamps, programs). If a learner uses a code, only the scoped courses show the discounted price.

### 3. Attribution
- Any visit with `?dc=CODE` stores the code (cookie + localStorage, 30-day last-touch) and records a click event.
- Signups completed while a code is stored are attributed to that referrer.
- Checkout auto-applies the stored code, and learners can also type a code manually. Discount is validated and recalculated **server-side** in both the card and mobile-money checkout functions so the browser cannot alter the price.
- Paid orders write a redemption row with order amount, discount amount, and commission.

### 4. Leaderboard & admin module
New Discount Codes area in the super-admin dashboard:
- **Codes**: list/create/edit codes, scope courses, activate/deactivate.
- **Applications**: pending queue with approve/decline.
- **Leaderboard**: ranked table of referrers by clicks, signups, paid orders, gross revenue, discount given, commission earned — with a date-range filter and CSV export.
- **Redemptions**: per-order log, filterable by code.
- Gated by a new `discount_admin` module role alongside `admin`, wired into the existing Access Control matrix.

## Technical notes

**New tables** (public schema, each with grants + RLS):
- `discount_codes` — code, owner profile, percent_off, commission_percent, max_redemptions, starts_at/ends_at, is_active, qr/link fields.
- `discount_code_products` — code ↔ product scoping.
- `discount_code_applications` — public applications, status pending/approved/declined.
- `discount_code_clicks` — click/visit events (no PII beyond hashed IP + UA).
- `discount_code_signups` — attributed signups.
- `discount_code_redemptions` — payment_id, order amount, discount amount, commission amount, status.

RLS: admins/`discount_admin` manage everything; referrers read only their own code, stats and redemptions; anonymous users may insert applications and click events only. A security-definer function resolves a code to its public-safe fields (percent, valid products) for checkout preview.

**Edge functions**
- `discount-validate` — resolve a code against a product, returning discounted price (used by checkout UI).
- `discount-apply-application` — approve/decline flow, code + QR generation.
- `discount-track` — records clicks and signup attribution.
- `stripe-checkout` and `iotec-collect` are extended to re-derive the discounted amount server-side and store the code in payment metadata; the corresponding webhooks write the redemption + commission rows once a payment completes.

**Frontend**
- `src/lib/discountCodes.ts` — capture/persist/read helper mirroring the existing referral cookie approach.
- Checkout: discount code input, applied-discount summary, updated totals.
- New pages: `/partners/apply` (public form), `/partners/portal` (referrer stats + QR), `/admin-discounts` (admin module, added to the sidebar).

**Out of scope**: payouts/withdrawals, stacking multiple codes, fixed-amount discounts, and changes to the existing affiliate program.

## Suggested build order
1. Database schema, grants, RLS, `discount_admin` role.
2. Admin module: codes CRUD + course scoping.
3. Attribution helper + tracking function + signup attribution.
4. Server-side discount in both checkout flows + redemption writes in webhooks.
5. Public application form, approval flow, code/QR generation, referrer portal.
6. Leaderboard, redemptions log, CSV export.
