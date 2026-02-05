import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function NdaAccessPage({ params }: { params: { token: string } }) {
  const token = params.token;

  // TODO: validate token in your DB (Supabase or any DB)
  // Example (pseudo):
  // const row = await db.nda_access_tokens.findValid(token)
  // if (!row) return notFound()

  // For now, set a cookie that your app uses to "unblur"
  (await
        // TODO: validate token in your DB (Supabase or any DB)
        // Example (pseudo):
        // const row = await db.nda_access_tokens.findValid(token)
        // if (!row) return notFound()
        // For now, set a cookie that your app uses to "unblur"
        cookies()).set('nda_access', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Redirect investor to ideas list or the specific idea
  redirect('/investor/ideas');
}