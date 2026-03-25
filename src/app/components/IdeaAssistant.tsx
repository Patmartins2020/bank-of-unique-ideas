"use client";

import { useState } from "react";

export default function IdeaAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FLOATING BUTTON */}
      <div
        className="fixed right-4 sm:right-6 z-[9999]"
        style={{ bottom: "env(safe-area-inset-bottom, 80px)" }} // safe on mobile + above ticker
      >
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white text-xl hover:bg-emerald-400 transition"
        >
          💡
        </button>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          
          {/* PANEL */}
          <div className="w-full max-w-sm sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-xl p-4 animate-slideUp">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">
                Idea Assistant
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* OPTIONS */}
            <div className="space-y-3">

              <button
                onClick={() => {
                  window.location.href = "/submit";
                }}
                className="w-full p-3 rounded-lg bg-emerald-500 text-black font-semibold text-left"
              >
                🚀 Protect my idea
              </button>

              <button
                onClick={() => {
                  window.location.href = "/#ideas-grid";
                }}
                className="w-full p-3 rounded-lg bg-slate-800 text-white text-left"
              >
                🔍 Explore ideas
              </button>

              <div className="text-xs text-white/70 bg-slate-800 p-3 rounded-lg">
                🔒 NDA ensures ideas remain protected until access is granted.
              </div>

              <button
                onClick={() => {
                  window.location.href = "/contact";
                }}
                className="w-full p-3 rounded-lg bg-red-500/80 text-white text-left"
              >
                ⚠ Contact Admin / Report Issue
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ANIMATION */}
      <style jsx>{`
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}