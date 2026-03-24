'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function IdeaAssistant() {
  const supabase = createClientComponentClient();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'contact'>('menu');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  /* ================= SEND MESSAGE ================= */
  async function handleSend() {
    if (!message.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('support_messages').insert({
      user_id: user?.id || null,
      email: user?.email || null,
      message,
    });

    if (error) {
      alert('Failed to send message.');
    } else {
      setMessage('');
      loadMessages(); // refresh instantly
      alert('Message sent!');
    }
  }

  /* ================= LOAD MESSAGES ================= */
  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setMessages(data || []);
  }

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadMessages();
  }, []);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* FLOAT BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-16 right-4 z-50 bg-emerald-400 text-black w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
      >
        💡
      </button>

      {/* PANEL */}
      {open && (
        <div className="fixed bottom-28 right-4 z-50 w-[90%] max-w-sm bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-4 text-white">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-emerald-300">Idea Assistant</h2>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* MENU */}
        {view === 'menu' && (
  <div className="space-y-3 text-sm">

    <button
      className="w-full text-left px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
      onClick={() => window.location.href = '/submit'}
    >
      🚀 Protect my idea
    </button>

    <button
      className="w-full text-left px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
      onClick={() => window.location.href = '/'}
    >
      🔍 Explore ideas
    </button>

    <div className="px-4 py-3 bg-white/5 rounded-lg text-xs text-white/70 leading-relaxed pointer-events-none">
      🔐 NDA protects ideas before full access is granted.
    </div>

    <button
      className="w-full text-left px-4 py-3 bg-red-500/20 rounded-lg hover:bg-red-500/30 text-red-300 transition"
      onClick={() => setView('contact')}
    >
      ❗ Contact Admin / Report Issue
    </button>

  </div>
)}

          {/* CONTACT + LIVE REPLIES */}
          {view === 'contact' && (
            <div className="space-y-3 text-sm">

              <p className="text-white/70">
                Need help? Send a message to admin.
              </p>

              <textarea
                className="w-full p-2 rounded bg-black border border-white/20 text-white"
                rows={4}
                placeholder="Describe your issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                onClick={handleSend}
                className="w-full bg-emerald-400 text-black py-2 rounded font-semibold"
              >
                Send Message
              </button>

              {/* 🔥 LIVE MESSAGE THREAD */}
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">

                {messages.length === 0 && (
                  <p className="text-white/50 text-xs">No messages yet.</p>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2 bg-black/60 rounded border border-white/10"
                  >
                    <p className="text-white/80 text-xs">
                      You: {msg.message}
                    </p>

                    {msg.admin_reply && (
                      <p className="text-emerald-300 text-xs mt-1">
                        Admin: {msg.admin_reply}
                      </p>
                    )}
                  </div>
                ))}

              </div>

              <button
                onClick={() => setView('menu')}
                className="text-xs text-white/60 underline"
              >
                ← Back
              </button>

            </div>
          )}

        </div>
      )}
    </>
  );
}