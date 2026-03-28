// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomeRedirect() {
  // Immediately send users to the  page
  redirect('/');
}