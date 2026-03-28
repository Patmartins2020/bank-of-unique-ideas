'use client';

import React, { useState, ReactElement } from 'react';
import Link from 'next/link';

type Role = 'inventor' | 'investor';

export default function IdeaAssistant(): ReactElement {
  const [open, setOpen] = useState<boolean>(false);

  const role: Role = ('inventor' as Role); // TODO: Fetch from user session/context
  const hasIdeas: boolean = false; // TODO: Fetch based on user's ideas
  const userName: string = 'there'; // TODO: Fetch from user session/context

  let subtitle: string = 'What would you like to do today?';

  if (role === 'inventor' && !hasIdeas) {
    subtitle = "Let's secure your first idea before sharing it publicly.";
  } else if (role === 'investor') {
    subtitle = 'Discover breakthrough ideas from creators.';
  } else if (role === 'inventor' && hasIdeas) {
    subtitle = 'Continue managing your ideas.';
  }

  return (
    <>
      {/* ICON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full p-4 shadow-lg"
      >
        💡
      </button>

      {/* PANEL */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-[#0b0f1a] text-white rounded-xl shadow-2xl border border-white/10 z-50 p-4 space-y-4">

          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Idea Assistant</h2>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>

          <p className="text-white/70 text-sm">
            Welcome {userName}. {subtitle}
          </p>

          {role === 'inventor' && !hasIdeas && (
            <Link
              href="/deposit"
              className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition"
            >
              🚀 Protect My Idea
            </Link>
          )}

          {role === 'inventor' && hasIdeas && (
            <Link
              href="/my-ideas"
              className="block w-full px-4 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
            >
              📌 Manage My Ideas
            </Link>
          )}

          {role === 'investor' && (
            <Link
              href="/investor/ideas"
              className="block w-full px-4 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
            >
              🔍 Explore Ideas
            </Link>
          )}

          <Link
            href="/home"
            className="block w-full px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            🌍 View Public Ideas
          </Link>

          <div className="text-xs text-white/60 bg-white/5 p-3 rounded-lg">
            🔒 NDA ensures your idea stays protected.
          </div>

          <a
            href="mailto:info@globui.com"
            className="block w-full px-4 py-3 rounded-lg bg-white-500 text-white font-semibold hover:bg-red-400"
          >
            ⚠ Contact Admin
          </a>

        </div>
      )}
    </>
  );
}