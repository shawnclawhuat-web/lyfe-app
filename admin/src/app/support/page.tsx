import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support — Lyfe',
  description: 'Get help and support for the Lyfe app.',
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Support</h1>
      <p className="mt-4 text-muted-foreground">
        Need help with Lyfe? We&apos;re here for you.
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Contact Us</h2>
          <p className="mt-1 text-muted-foreground">
            For any questions, issues, or feedback, reach out to us at:
          </p>
          <a
            href="mailto:shawnleejob@gmail.com"
            className="mt-2 inline-block text-primary underline underline-offset-4"
          >
            shawnleejob@gmail.com
          </a>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
          <dl className="mt-3 space-y-4">
            <div>
              <dt className="font-medium">How do I reset my account?</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Contact our support team and we&apos;ll help you regain access
                to your account.
              </dd>
            </div>
            <div>
              <dt className="font-medium">
                How do I report a bug or request a feature?
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Email us at the address above with a description of the issue or
                your feature request.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Lyfe. All rights reserved.
      </footer>
    </main>
  );
}
