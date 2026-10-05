import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

const Privacy = () => {
  const lastUpdated = "April 21, 2026";

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Maarifasasa</title>
        <meta
          name="description"
          content="How Maarifasasa collects, uses, and protects your personal information across our learning, payment, and affiliate services."
        />
        <link rel="canonical" href="https://maarifasasa.com/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maarifasasa.com/privacy" />
        <meta property="og:title" content="Privacy Policy | Maarifasasa" />
        <meta property="og:description" content="How Maarifasasa collects, uses, and protects your personal information." />
        <meta property="og:image" content="https://maarifasasa.com/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy | Maarifasasa" />
        <meta name="twitter:description" content="How Maarifasasa collects, uses, and protects your personal information." />
        <meta name="twitter:image" content="https://maarifasasa.com/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png" />
      </Helmet>

      <main className="pt-28 pb-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </header>

          <article className="prose prose-slate max-w-none text-foreground/90 space-y-8">
            <section>
              <p className="text-lg leading-relaxed">
                Maarifasasa ("we", "us", "our") is a Pan-African workforce development
                company on a mission to unlock 1 million digital earning opportunities
                by 2030. This Privacy Policy explains what information we collect when
                you use our website, learning platform, payment services, and affiliate
                program, and how we use, share, and protect that information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">1. Information we collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account information:</strong> name, email, phone, location,
                  password (hashed), and optional profile details (bio, links, skills).
                </li>
                <li>
                  <strong>Learning activity:</strong> assessments, course enrolments,
                  progress, certificates, and AI Pathway Advisor responses.
                </li>
                <li>
                  <strong>Payment information:</strong> billing name, email, phone, and
                  transaction metadata. Card details are processed by Stripe and mobile
                  money details by ioTec Pay — we never store full card numbers.
                </li>
                <li>
                  <strong>Affiliate data:</strong> referral codes, click attribution,
                  conversions, and payout details for affiliates.
                </li>
                <li>
                  <strong>Technical data:</strong> IP address (hashed for affiliate
                  clicks), device, browser, referrer, and cookies such as{" "}
                  <code>ms_affiliate_ref</code> for 30-day last-click attribution.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">2. How we use your information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deliver courses, bootcamps, certificates, and mentor sessions.</li>
                <li>Process payments and issue receipts via Stripe and ioTec Pay.</li>
                <li>Personalise learning pathways through the AI Advisor.</li>
                <li>Send transactional and product emails (via Resend).</li>
                <li>Track affiliate referrals and pay commissions.</li>
                <li>Improve our platform, prevent fraud, and meet legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">3. Sharing of information</h2>
              <p>We share data only with trusted processors required to run our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe</strong> — international card payments.</li>
                <li><strong>ioTec Pay</strong> — Ugandan mobile money payments.</li>
                <li><strong>Thinkific</strong> — course delivery and enrolment.</li>
                <li><strong>Resend</strong> — transactional email delivery.</li>
                <li><strong>Google</strong> — calendar and meet links for mentor calls.</li>
                <li><strong>Lovable Cloud</strong> — secure data hosting and storage.</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information. We may disclose information
                when required by law or to protect our rights and users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">4. Cookies & tracking</h2>
              <p>
                We use essential cookies for authentication and a small number of
                analytics and attribution cookies (e.g. <code>ms_affiliate_ref</code>).
                You can clear cookies in your browser at any time; doing so may sign
                you out or break referral attribution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">5. Data retention</h2>
              <p>
                We keep account and learning records for as long as your account is
                active or as needed to provide services. Payment records are retained
                as required by tax and accounting laws. You may request deletion of
                your account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">6. Your rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access, correct, or update your personal information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Withdraw consent for marketing emails at any time.</li>
                <li>Lodge a complaint with your local data protection authority.</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, email{" "}
                <a className="text-primary underline" href="mailto:privacy@maarifasasa.com">
                  privacy@maarifasasa.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">7. Security</h2>
              <p>
                We use industry-standard safeguards including encrypted connections,
                role-based access control, and Row-Level Security on our database. No
                system is 100% secure; please use a strong, unique password and keep
                your login credentials private.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">8. Children's privacy</h2>
              <p>
                Our services are intended for users aged 16 and above. If you believe
                a child under 16 has provided us personal data, please contact us so
                we can remove it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">9. Changes to this policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be
                announced on this page and, where appropriate, by email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-3">10. Contact us</h2>
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
                <Link to="/terms" className="text-primary underline">
                  Terms of Service
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

export default Privacy;