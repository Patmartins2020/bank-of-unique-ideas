import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import LiveTicker from '@/app/components/LiveTicker';
import IdeaAssistant from '@/app/components/IdeaAssistant';

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

  // ❌ Not logged in
  if (!user?.email) {
    redirect('/admin');
  }

  // ❌ Not admin
  if (user.email.toLowerCase() !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    redirect('/admin');
  }

  // ✅ Admin access granted
  return (
   <html>
  <body>
    {children}
    <IdeaAssistant />
    <LiveTicker />
  </body>
</html>
  );
}