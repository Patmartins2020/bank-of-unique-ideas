// src/app/nda/[id]/page.tsx

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';

<div style={{ padding: 20, background: 'red', color: 'white' }}>
  NDA PAGE IS LOADING FROM: src/app/nda/[id]/page.tsx ✅✅✅
</div>
type NDA = {
  id: string;
  status: 'pending' | 'signed' | 'approved' | 'rejected';
  signed_nda_path: string | null;
};

async function getNDA(id: string): Promise<NDA> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_VERCEL_URL
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : '';

  if (!base) throw new Error('Missing site url env');

  const res = await fetch(`${base}/api/nda/get?id=${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Invalid NDA');
  const json = await res.json();
  return json.nda;
}

export default async function NDAPage({ params }: { params: { id: string } }) {
  let nda: NDA;

  try {
    nda = await getNDA(params.id);
  } catch {
    notFound();
  }

  if (nda.status === 'approved') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>This NDA has already been approved.</p>
      </main>
    );
  }

  if (nda.status === 'rejected') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>This NDA request was rejected.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl">
        <h1 className="text-xl mb-4">NDA Request</h1>

        <a
          href="/nda-template/NDA.pdf"
          target="_blank"
          className="block mb-4 underline text-emerald-400"
        >
          Download NDA Template
        </a>

        {nda.status === 'signed' ? (
          <p className="text-emerald-300">
            Signed NDA uploaded. Awaiting admin review.
          </p>
        ) : (
          <form
            action="/api/nda/upload"
            method="post"
            encType="multipart/form-data"
            className="space-y-3"
          >
            <input type="hidden" name="requestId" value={nda.id} />

            <input
              type="file"
              name="file"
              accept=".pdf,.png,.jpg,.jpeg"
              required
            />

            <button className="w-full py-2 bg-emerald-500 rounded">
              Upload Signed NDA
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
