# Payments Audit page (admin)

A new admin page that answers, per learner and per payment: did the payment succeed, was the invoice/receipt actually generated, and did the email reach them?

## Why a schema addition is needed

Today the documents table records only success facts (`storage_path`, `issued_at`, `emailed_at`). Failed generation attempts and failed/bounced emails leave no trace, so an audit view built on current data could only show "document present / absent" with no reason. The plan adds attempt and outcome tracking so the page can show real results.

## What gets built

### 1. Attempt + delivery tracking (database)

Add to the payment documents table:
- generation attempt count, last attempt time, last error message
- email status (not attempted / sent / failed), last email error, email attempt count, Resend message id

New rows are written even when generation fails, so a failed attempt is visible instead of silently missing.

### 2. Document/email issuing updates (backend)

Update the shared document helper and the `payment-documents` function so every issuance path records the outcome:
- successful generation: path, number, issued time, attempt count
- failed generation: error text and attempt time, no storage path
- email: sent time + provider message id, or failure reason

The Stripe and mobile-money callbacks already call this helper, so both providers are covered without changes there.

### 3. `/admin-payments-audit` page

Access: super admin plus `payments_admin` (same guard style as Payouts). Added to the admin sidebar under Payments.

Layout:
- Summary cards: successful payments, payments missing documents, generation failures, email failures
- Filters: status, provider, date range, and a search box for learner name / email / reference
- Audit table, one row per payment: learner (name + email), product, amount + currency, payment status, invoice state, receipt state, email state, timestamps
- State chips are colour coded: issued / pending / failed, with the error text in a tooltip
- Row click opens a detail sheet with the full timeline (payment created, completed, invoice generated, receipt generated, email sent/failed), the raw error messages, provider references, and buttons to download the invoice/receipt or re-issue and re-send
- CSV export of the filtered view, using the existing export helper

Retry action calls the existing `payment-documents` function; the new attempt and its outcome are then reflected in the table.

## Technical notes

- Migration: `ALTER TABLE public.payment_documents` adding the tracking columns (nullable / defaulted, no data loss); existing admin read policies already cover the page.
- Query: one paginated join of payments with their documents via React Query (`staleTime` 60s), matching the caching used in the current payments view.
- New files: `src/pages/AdminPaymentsAudit.tsx`, `src/components/admin/payments/PaymentsAuditTable.tsx`, `src/components/admin/payments/PaymentAuditDetailSheet.tsx`.
- Edited: `src/App.tsx` (route), `src/components/admin/AdminSidebar.tsx` (nav item), `supabase/functions/_shared/paymentDocuments.ts`, `supabase/functions/payment-documents/index.ts`.
- Fully responsive: table on desktop, stacked cards on mobile.
