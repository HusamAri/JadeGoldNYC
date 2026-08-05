import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Amuletta by Artifact Studio — how we collect, use, and protect data when you use the platform and connected services such as Pinterest.",
  robots: { index: true, follow: true },
};

const UPDATED = "20 July 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground relative isolate min-h-svh">
      <div aria-hidden className="holo-drift" />
      <div aria-hidden className="lux-grain" />

      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-8">
        <Link href="/login" className="inline-flex items-center gap-3">
          <Logo />
          <span className="font-mono text-xs tracking-[0.14em] uppercase">
            Amuletta
          </span>
        </Link>
        <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
          Privacy
        </span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24">
        <article className="glass-board space-y-8 rounded-[26px] px-6 py-8 sm:px-10 sm:py-10">
          <header className="space-y-3">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
              Artifact Studio · Legal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm">
              Last updated: {UPDATED}
            </p>
            <p className="text-sm leading-relaxed">
              This Privacy Policy explains how Artifact Studio (&quot;we&quot;,
              &quot;us&quot;, &quot;our&quot;) collects, uses, stores, and
              shares information when you use{" "}
              <strong>Amuletta</strong> at{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://amuletta.artifactstudio.info"
              >
                amuletta.artifactstudio.info
              </a>{" "}
              and related services, including integrations with third-party
              platforms such as Pinterest, Etsy, ShipStation, Shopier, and
              Shopify.
            </p>
          </header>

          <Section title="1. Who we are">
            <p>
              Amuletta is a multi-brand ecommerce operations panel operated by
              Artifact Studio. It helps brand teams manage sales, costs,
              performance, and connected marketing channels from one place.
            </p>
            <p>
              Controller contact:{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="mailto:privacy@artifactstudio.info"
              >
                privacy@artifactstudio.info
              </a>
            </p>
          </Section>

          <Section title="2. Information we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Account data:</strong> name, email address, password
                (hashed), organization membership, and role.
              </li>
              <li>
                <strong>Business operations data:</strong> orders, listings,
                costs, analytics, and related records you or your integrations
                sync into Amuletta.
              </li>
              <li>
                <strong>Connected account tokens:</strong> OAuth access and
                refresh tokens, API keys, and account identifiers for services
                you choose to connect (for example Pinterest Business, Etsy,
                ShipStation, Shopier, Shopify).
              </li>
              <li>
                <strong>Pinterest data (when connected):</strong> profile and
                business account identifiers, boards, pins, media metadata,
                publishing status, and analytics or reporting metrics available
                through the Pinterest API for the authenticated account.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, device/browser
                information, cookies needed for authentication and security, and
                basic usage logs.
              </li>
            </ul>
          </Section>

          <Section title="3. How we use information">
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, secure, and improve the Amuletta panel.</li>
              <li>
                Authenticate users and enforce organization access controls.
              </li>
              <li>
                Sync and display data from connected platforms you authorize.
              </li>
              <li>
                Create, schedule, or manage Pins and related content when you
                use Pinterest features inside Amuletta.
              </li>
              <li>
                Send operational emails you configure (for example digests or
                alerts).
              </li>
              <li>Comply with law and protect against abuse or fraud.</li>
            </ul>
            <p>
              We do not sell personal data. We do not use Pinterest data to
              build a public consumer feed or to access other people&apos;s
              Pins/Boards beyond the authenticated account you connect.
            </p>
          </Section>

          <Section title="4. Legal bases (where applicable)">
            <p>
              Depending on your location, we process data based on contract
              performance (providing the service), legitimate interests
              (security, product improvement, internal operations), consent
              (where required for specific connections or communications), and
              legal obligations.
            </p>
          </Section>

          <Section title="5. Sharing">
            <p>We share information only as needed with:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Infrastructure providers</strong> that host Amuletta
                (for example Vercel and Supabase).
              </li>
              <li>
                <strong>Connected platforms</strong> you authorize, including
                Pinterest, to carry out the actions you request.
              </li>
              <li>
                <strong>Service providers</strong> that help us send email or
                operate the product, under appropriate confidentiality and
                security terms.
              </li>
              <li>
                Authorities when required by law, or professional advisors under
                confidentiality.
              </li>
            </ul>
            <p>
              Within an organization on Amuletta, authorized members of that
              organization may see shared operational data for that
              organization.
            </p>
          </Section>

          <Section title="6. International transfers">
            <p>
              Amuletta is hosted on cloud infrastructure that may process data
              in the United States or other countries. Where required, we use
              appropriate safeguards for cross-border transfers.
            </p>
          </Section>

          <Section title="7. Retention">
            <p>
              We keep account and operational data for as long as your
              organization uses Amuletta and as needed for security, backups,
              dispute resolution, and legal compliance. Connected-platform
              tokens are retained while the connection remains active and are
              removed or invalidated when you disconnect or delete the
              connection, subject to backup cycles.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We use industry-standard measures including encrypted transport
              (HTTPS), access-controlled databases, hashed passwords, and
              least-privilege service roles. No method of transmission or
              storage is 100% secure.
            </p>
          </Section>

          <Section title="9. Your choices and rights">
            <ul className="list-disc space-y-2 pl-5">
              <li>Update profile details in Amuletta settings.</li>
              <li>
                Disconnect third-party integrations (including Pinterest) at any
                time from settings / connected apps.
              </li>
              <li>
                Request access, correction, deletion, or export of personal data
                we hold, subject to legal limits.
              </li>
              <li>
                Withdraw consent where processing is based on consent, without
                affecting prior lawful processing.
              </li>
            </ul>
            <p>
              Contact{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="mailto:privacy@artifactstudio.info"
              >
                privacy@artifactstudio.info
              </a>{" "}
              to exercise these rights. You may also have the right to lodge a
              complaint with a supervisory authority.
            </p>
          </Section>

          <Section title="10. Children">
            <p>
              Amuletta is intended for business users and is not directed to
              children under 16. We do not knowingly collect personal data from
              children.
            </p>
          </Section>

          <Section title="11. Third-party services">
            <p>
              Connected platforms have their own privacy policies. When you
              connect Pinterest, their terms and privacy policy also apply to
              data processed by Pinterest. Review Pinterest&apos;s policies
              before authorizing access.
            </p>
          </Section>

          <Section title="12. Changes">
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last
              updated&quot; date at the top will change when we do. Continued use
              of Amuletta after an update means you acknowledge the revised
              policy.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Artifact Studio
              <br />
              Email:{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="mailto:privacy@artifactstudio.info"
              >
                privacy@artifactstudio.info
              </a>
              <br />
              Product: Amuletta (
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://amuletta.artifactstudio.info"
              >
                amuletta.artifactstudio.info
              </a>
              )
            </p>
          </Section>
        </article>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
