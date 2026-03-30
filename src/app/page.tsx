// app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Immediately send users to the home page
  redirect('/home');
}