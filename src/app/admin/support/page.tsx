'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SupportInbox() {
  const supabase = createClientComponentClient();

  const [messages, setMessages] = useState<any[]>([]);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    setMessages(data || []);
  }

  async function sendReply(id: string) {
    const reply = replyMap[id];
    if (!reply?.trim()) return;

    await supabase
      .from('support_messages')
      .update({
        admin_reply: reply,
        replied_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', id);

    setReplyMap((prev) => ({ ...prev, [id]: '' }));
    loadMessages();
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400">
        Support Inbox
      </h1>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-4 bg-neutral-900 rounded-lg border border-white/10">

            <p className="text-sm text-white/60">
              {msg.email || 'Anonymous'}
            </p>

            <p className="mt-2">{msg.message}</p>

            <p className="text-xs mt-2 text-white/40">
              {new Date(msg.created_at).toLocaleString()}
            </p>

            {/* ADMIN REPLY */}
            {msg.admin_reply && (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-300/20 rounded">
                <p className="text-emerald-300 text-sm font-semibold">
                  Admin Reply:
                </p>
                <p className="text-sm">{msg.admin_reply}</p>
              </div>
            )}

            {/* REPLY BOX */}
            {!msg.admin_reply && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-2 bg-black border border-white/20 rounded text-white text-sm"
                  rows={3}
                  placeholder="Write reply..."
                  value={replyMap[msg.id] || ''}
                  onChange={(e) =>
                    setReplyMap((prev) => ({
                      ...prev,
                      [msg.id]: e.target.value,
                    }))
                  }
                />
{/* USER REPLIES */}
<div className="mt-3 text-xs text-white/70">
  <p className="mb-1 text-emerald-300">Your recent replies:</p>

  {/* You can later fetch real data */}
  <p>No replies yet.</p>
</div>


                <button
                  onClick={() => sendReply(msg.id)}
                  className="px-3 py-1 bg-emerald-400 text-black text-xs rounded"
                >
                  Send Reply
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </main>
  );
}