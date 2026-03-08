import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'You\'re Invited — Lyfe',
  description: 'Join Lyfe and start your insurance career.',
};

function maskPhone(phone: string): string {
  // Show last 4 digits only: ****2222
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '****' + digits.slice(-4);
}

async function getInviteData(token: string) {
  const supabase = createServiceClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('name, phone, status, assigned_manager_id')
    .eq('invite_token', token)
    .single();

  if (!candidate) return null;

  // Soft guard: if candidate has progressed beyond applied, treat as used
  if (candidate.status !== 'applied') return null;

  let managerName: string | null = null;
  if (candidate.assigned_manager_id) {
    const { data: manager } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', candidate.assigned_manager_id)
      .single();
    managerName = manager?.full_name ?? null;
  }

  return {
    name: candidate.name,
    maskedPhone: maskPhone(candidate.phone),
    managerName,
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteData(token);

  if (!invite) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border bg-card p-10">
          <h1 className="text-2xl font-bold tracking-tight">
            Invalid Invite
          </h1>
          <p className="mt-3 text-muted-foreground">
            This invite link is invalid or has expired. Please contact the
            person who shared it with you.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl border bg-card p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {invite.name}!
        </h1>

        <p className="mt-3 text-muted-foreground">
          {invite.managerName
            ? `${invite.managerName} has invited you to join Lyfe.`
            : 'You\'ve been invited to join Lyfe.'}
        </p>

        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            How to get started
          </h2>
          <ol className="space-y-3 text-left text-[15px]">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <span>Download the Lyfe app from the App Store</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <span>
                Sign up with your phone number ending in{' '}
                <span className="font-mono font-semibold">
                  {invite.maskedPhone}
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <span>Complete your profile and you&apos;re all set</span>
            </li>
          </ol>
        </div>
      </div>

      <footer className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Lyfe. All rights reserved.
      </footer>
    </main>
  );
}
