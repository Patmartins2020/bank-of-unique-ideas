import { redirect } from "next/navigation";

export default function NdaAccessPage({ params }: { params: { token: string } }) {
  redirect(`/api/nda/access/${params.token}`);
}