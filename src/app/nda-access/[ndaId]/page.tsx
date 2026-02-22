import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NdaAccessPage({
  params,
}: {
  params: { ndaId: string };
}) {
  const ndaId = params.ndaId;

  if (!ndaId) {
    redirect("/investor/ideas"); // or a dedicated error page
  }

  // TODO: validate ndaId/token in DB (Supabase, etc.)
  // If invalid, redirect somewhere safe.

  // Set a cookie to unlock NDA view
  const cookieStore = await cookies(); // keep await if your Next version expects it
  cookieStore.set("nda_access", ndaId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/investor/ideas");
}