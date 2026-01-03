'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../../../../supabase';

export default function ClientButtons({
  id,
  status,
}: {
  id: string;
  status: 'pending' | 'viewed' | 'approved' | 'rejected';
}) {
  const router = useRouter();

  const markViewed = async () => {
    const { error } = await supabase
      .from('ideas')
      .update({
        review_status: 'viewed',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) router.refresh();
  };

  const approveIdea = async () => {
    const { error } = await supabase
      .from('ideas')
      .update({
        review_status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) router.refresh();
  };

  const deleteIdea = async () => {
    if (!confirm('Delete this idea?')) return;
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (!error) router.push('/dashboard');
  };

  return (
    <div className="flex gap-2">
      {/* Only show “Mark Viewed” when still pending */}
      <button
        onClick={markViewed}
        disabled={status !== 'pending'}
        className={`px-3 py-2 rounded-md text-sm ${
          status === 'pending'
            ? 'bg-emerald-600 text-white'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        Mark Viewed
      </button>

      {/* Approve always available (you can add your own rules) */}
      <button
        onClick={approveIdea}
        className="px-3 py-2 rounded-md text-sm bg-emerald-500 text-black"
      >
        Approve
      </button>

      <button
        onClick={deleteIdea}
        className="px-3 py-2 rounded-md text-sm bg-red-500 text-white"
      >
        Delete
      </button>
    </div>
  );
}
