'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AssistantView = 'menu' | 'protection' | 'contact';

export default function IdeaAssistant() {
  const supabase = createClientComponentClient();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AssistantView>('menu');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  async function handleSend() {
    if (!message.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('support_messages').insert({
      user_id: user?.id || null,
      email: user?.email || null,
      message,
    });

    if (error) {
      alert('Failed to send message.');
      return;
    }

    setMessage('');
    loadMessages();
    alert('Message sent!');
  }

  async function loadMessages() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setMessages(data || []);
  }

  useEffect(() => {
    loadMessages();
  }, []);

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
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-28 right-4 z-[9999] bg-emerald-400 text-black w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-emerald-300 transition"
        aria-label="Open Idea Assistant"
      >
        💡
      </button>

      {/* PANEL */}
      {open && (
        <div className="fixed bottom-44 right-4 z-[9999] w-[92%] max-w-sm bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-4 text-white">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-emerald-300 text-xl">Idea Assistant</h2>
              <p className="text-xs text-white/50 mt-1">
                Guidance for inventors and interested viewers
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* MENU VIEW */}
          {view === 'menu' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <p className="text-sm text-white/80">
                  What would you like to do today?
                </p>
              </div>

              <button
                className="w-full text-left px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10"
                onClick={() => {
                  window.location.href = '/submit';
                }}
              >
                <div className="font-semibold text-white">🔐 Submit & Protect My Idea</div>
                <div className="text-xs text-white/60 mt-1">
                  Keep your idea protected before wider exposure.
                </div>
              </button>

              <button
                className="w-full text-left px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                <div className="font-semibold text-white">🔍 Browse Protected Ideas</div>
                <div className="text-xs text-white/60 mt-1">
                  Explore available ideas and request NDA access where needed.
                </div>
              </button>

              <button
                className="w-full text-left px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10"
                onClick={() => setView('protection')}
              >
                <div className="font-semibold text-white">🛡️ How Idea Protection Works</div>
                <div className="text-xs text-white/60 mt-1">
                  Understand how blurred visibility and NDA access help protect inventors.
                </div>
              </button>

              <button
                className="w-full text-left px-4 py-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 text-red-200 transition border border-red-300/10"
                onClick={() => setView('contact')}
              >
                <div className="font-semibold">💬 Need Help? Contact Admin</div>
                <div className="text-xs text-red-100/70 mt-1">
                  Report an issue or send a support message.
                </div>
              </button>
            </div>
          )}

          {/* PROTECTION VIEW */}
          {view === 'protection' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                <h3 className="text-emerald-300 font-semibold mb-3">
                  How your idea is protected
                </h3>

                <ul className="space-y-2 text-sm text-white/75">
                  <li>✔ Your idea can appear blurred to reduce copying risk.</li>
                  <li>✔ Interested users must request NDA access before viewing sensitive details.</li>
                  <li>✔ Access can be controlled and tracked through your platform flow.</li>
                  <li>✔ Clues can attract attention without exposing the full concept.</li>
                </ul>
              </div>

              <button
                className="w-full px-4 py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition"
                onClick={() => {
                  window.location.href = '/submit';
                }}
              >
                🔐 Submit & Protect My Idea
              </button>

              <button
                onClick={() => setView('menu')}
                className="text-sm text-white/60 underline"
              >
                ← Back
              </button>
            </div>
          )}

          {/* CONTACT VIEW */}
          {view === 'contact' && (
            <div className="space-y-3">
              <p className="text-sm text-white/75">
                Need help or not satisfied with something? Send a message to admin.
              </p>

              <textarea
                className="w-full p-3 rounded-xl bg-black border border-white/20 text-white text-sm"
                rows={4}
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                onClick={handleSend}
                className="w-full bg-emerald-400 text-black py-3 rounded-xl font-semibold hover:bg-emerald-300 transition"
              >
                Send Message
              </button>

              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-white/50 text-xs">No messages yet.</p>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-black/60 rounded-xl border border-white/10"
                  >
                    <p className="text-white/80 text-xs">
                      You: {msg.message}
                    </p>

                    {msg.admin_reply && (
                      <p className="text-emerald-300 text-xs mt-2">
                        Admin: {msg.admin_reply}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setView('menu')}
                className="text-sm text-white/60 underline"
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