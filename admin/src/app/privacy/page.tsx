import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy — Lyfe',
    description: 'Privacy policy for the Lyfe app.',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Last updated:{' '}
                {new Date().toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="mt-10 space-y-8 text-[15px] leading-relaxed">
                <section>
                    <h2 className="text-lg font-semibold">1. Information We Collect</h2>
                    <p className="mt-2 text-muted-foreground">
                        We collect the following information when you use Lyfe:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                        <li>Phone number (for authentication)</li>
                        <li>Name and email address (provided by you)</li>
                        <li>Profile photo (optional)</li>
                        <li>Push notification tokens (for delivering notifications)</li>
                        <li>Activity data related to your use of the app (events, candidates, training progress)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
                    <p className="mt-2 text-muted-foreground">Your information is used to:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                        <li>Authenticate your identity and secure your account</li>
                        <li>Provide and improve our services</li>
                        <li>Send relevant push notifications</li>
                        <li>Facilitate team management and event coordination within your agency</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">3. Data Storage &amp; Security</h2>
                    <p className="mt-2 text-muted-foreground">
                        Your data is stored securely on Supabase-hosted infrastructure with encryption at rest and in
                        transit. We implement appropriate technical and organisational measures to protect your personal
                        data.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">4. Data Sharing</h2>
                    <p className="mt-2 text-muted-foreground">
                        We do not sell your personal data. Information may be shared within your agency hierarchy (e.g.
                        managers can view their team members&apos; activity) as part of the app&apos;s core
                        functionality.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">5. Your Rights</h2>
                    <p className="mt-2 text-muted-foreground">
                        You may request access to, correction of, or deletion of your personal data at any time by
                        contacting us at{' '}
                        <a href="mailto:admin@mktr.sg" className="text-primary underline underline-offset-4">
                            admin@mktr.sg
                        </a>
                        .
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">6. Changes to This Policy</h2>
                    <p className="mt-2 text-muted-foreground">
                        We may update this privacy policy from time to time. We will notify you of any material changes
                        through the app or by other means.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold">7. Contact</h2>
                    <p className="mt-2 text-muted-foreground">
                        If you have any questions about this privacy policy, please contact us at{' '}
                        <a href="mailto:admin@mktr.sg" className="text-primary underline underline-offset-4">
                            admin@mktr.sg
                        </a>
                        .
                    </p>
                </section>
            </div>

            <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Lyfe. All rights reserved.
            </footer>
        </main>
    );
}
