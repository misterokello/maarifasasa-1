import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const Terms = () => {
  const lastUpdated = "April 21, 2026";

  return (
    <>
      <Helmet>
        <title>Terms of Service | Maarifasasa</title>
        <meta
          name="description"
          content="The terms governing your use of Maarifasasa's learning platform, payments, certificates, mentor calls, and affiliate program."
        />
        <link rel="canonical" href="https://maarifasasa.com/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maarifasasa.com/terms" />
        <meta property="og:title" content="Terms of Service | Maarifasasa" />
        <meta property="og:description" content="The terms governing your use of Maarifasasa's learning platform, payments, certificates, and affiliate program." />
        <meta property="og:image" content="https://maarifasasa.com/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service | Maarifasasa" />
        <meta name="twitter:description" content="The terms governing your use of Maarifasasa's services." />
        <meta name="twitter:image" content="https://maarifasasa.com/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png" />
      </Helmet>

      <main className="pt-28 pb-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </header>

          <article className="prose prose-slate max-w-none text-foreground/90 space-y-8">
            <section>
              <p className="text-lg leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of the
                Maarifasasa website, learning platform, payment services, mentor
                calls, AI Pathway Advisor, and affiliate program (collectively, the
                "Services"). By using the Services, you agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">1. Eligibility & accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 16 years old to create an account.</li>
                <li>You are responsible for keeping your credentials confidential.</li>
                <li>You agree to provide accurate billing and contact information.</li>
                <li>We may suspend or close accounts that violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">2. Programs, courses & certificates</h2>
              <p>
                Maarifasasa offers bootcamps, the Talent Accelerator, advanced
                certificates, the Digital Field Agents programme, and other learning
                products. Course content, schedules, and instructors may change. Upon
                successful completion you may receive a digital certificate. Cohort
                start dates and seat availability are not guaranteed and are confirmed
                only after full or installment payment is received.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">3. Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  International payments are processed in USD by{" "}
                  <strong>Stripe</strong>. Local payments are processed in UGX by{" "}
                  <strong>ioTec Pay</strong> (mobile money).
                </li>
                <li>
                  All prices are displayed inclusive of applicable processor fees
                  unless stated otherwise.
                </li>
                <li>
                  Bootcamps may be paid in two 50% installments where indicated.
                  Access to materials may be limited until installments are settled.
                </li>
                <li>
                  You authorise us to share necessary billing details with our payment
                  processors to complete the transaction.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">4. Refunds & cancellations</h2>
              <p>
                Because course access is granted immediately upon payment, fees are
                generally <strong>non-refundable</strong>. We may, at our discretion,
                offer a refund or credit if a cohort is cancelled by Maarifasasa, or
                where required by law. Refund requests must be made within 7 days of
                purchase to{" "}
                <a className="text-primary underline" href="mailto:billing@maarifasasa.com">
                  billing@maarifasasa.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">5. Affiliate program</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Affiliates earn commissions on qualifying purchases attributed via a
                  30-day last-click cookie.
                </li>
                <li>
                  Self-referrals, fraudulent clicks, paid brand-bidding, spam, or
                  misrepresentation of Maarifasasa are prohibited and result in
                  forfeiture of commissions and account termination.
                </li>
                <li>
                  Payouts are made via the method on file once the minimum threshold
                  is reached and the conversion has cleared the refund window.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">6. Acceptable use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Share, resell, or redistribute course materials without permission.</li>
                <li>Reverse engineer, scrape, or disrupt the Services.</li>
                <li>Upload unlawful, harmful, or infringing content.</li>
                <li>Impersonate another person or misuse referral codes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">7. Intellectual property</h2>
              <p>
                All Maarifasasa content, course materials, branding, and software are
                owned by Maarifasasa or our licensors and are protected by copyright
                and trademark laws. You receive a personal, non-transferable, limited
                licence to access purchased materials for your own learning.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">8. AI Pathway Advisor & mentor calls</h2>
              <p>
                The AI Pathway Advisor provides guidance generated by AI models and is
                informational only — not a guarantee of employment or earnings. Mentor
                calls are scheduled via Google Calendar and Google Meet; please join
                on time and respect our mentors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">9. Disclaimers</h2>
              <p>
                The Services are provided "as is" and "as available". We do not
                guarantee specific job placement, income, or learning outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">10. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, Maarifasasa is not liable for
                indirect, incidental, special, or consequential damages. Our total
                liability for any claim is limited to the amount you paid us in the
                12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">11. Termination</h2>
              <p>
                We may suspend or terminate your access for breach of these Terms.
                You may close your account at any time by contacting us. Provisions
                that by their nature should survive termination will do so.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">12. Governing law</h2>
              <p>
                These Terms are governed by the laws of the Republic of Uganda.
                Disputes will be resolved in the competent courts of Uganda, without
                prejudice to mandatory consumer protection laws in your country of
                residence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">13. Changes to these Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the
                Services after changes take effect constitutes acceptance of the new
                Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">14. Contact</h2>
              <p>
                Maarifasasa<br />
                Plot 26 Boundary Road, Lira City, Uganda<br />
                Email:{" "}
                <a className="text-primary underline" href="mailto:info@maarifasasa.com">
                  info@maarifasasa.com
                </a>
                <br />
                Phone: +256 783 146 325
              </p>
              <p className="mt-6">
                See also our{" "}
                <Link to="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
};

export default Terms;