// src/app/nda/[id]/page.tsx
import { notFound } from "next/navigation";

type NDA = {
  id: string;
  status: "pending" | "signed" | "approved" | "rejected";
  signed_nda_path: string | null;
};

async function getNDA(id: string): Promise<NDA> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/nda/get?id=${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Invalid NDA");
  const json = await res.json();
  return json.nda;
}

export default async function NDAPage({
  params,
}: {
  params: { id: string };
}) {
  let nda: NDA;

  try {
    nda = await getNDA(params.id);
  } catch {
    notFound();
  }

  /* ───────────── APPROVED ───────────── */
  if (nda.status === "approved") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="bg-slate-900 p-6 rounded-xl text-center">
          <h1 className="text-xl mb-2">Access Granted</h1>
          <p>Your NDA has been approved. You will receive access shortly.</p>
        </div>
      </main>
    );
  }

  /* ───────────── REJECTED ───────────── */
  if (nda.status === "rejected") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="bg-slate-900 p-6 rounded-xl text-center">
          <h1 className="text-xl mb-2">NDA Rejected</h1>
          <p>This NDA request was rejected.</p>
        </div>
      </main>
    );
  }

  /* ───────────── SIGNED (WAITING) ───────────── */
  if (nda.status === "signed") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="bg-slate-900 p-6 rounded-xl text-center">
          <h1 className="text-xl mb-2">NDA Received</h1>
          <p>
            Thank you. Your signed NDA has been received and is currently under
            review.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            You will be notified by email once approved.
          </p>
        </div>
      </main>
    );
  }

  /* ───────────── PENDING (UPLOAD) ───────────── */
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-lg p-6 bg-slate-900 rounded-xl">
        <h1 className="text-xl mb-4">NDA Request</h1>

        {/* DOWNLOAD TEMPLATE */}
        <a
          href="/nda-template/NDA.pdf"
          target="_blank"
          className="block mb-4 underline text-emerald-400"
        >
          Download NDA Template
        </a>

        {/* UPLOAD SIGNED NDA */}
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
      </div>
    </main>
  );
}