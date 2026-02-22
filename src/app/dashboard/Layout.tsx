import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const ADMIN_EMAIL =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com').toLowerCase();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → kick out
  if (!user?.email) {
    redirect('/admin');
  }

  // Logged in but NOT admin → kick out
  if (user.email.toLowerCase() !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    redirect('/admin');
  }

  // ✅ Admin confirmed → allow access
  return <>{children}</>;
}