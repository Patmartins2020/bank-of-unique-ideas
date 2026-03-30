'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Role = 'inventor' | 'investor' | 'admin';

export default function IdeaAssistant() {
  const supabase = createClientComponentClient();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<Role>('inventor');
  const [hasIdeas, setHasIdeas] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function loadSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        }

        if (profile?.role) {
          setRole(profile.role);
        }

        // inventor ideas check
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        setHasIdeas((ideas?.length || 0) > 0);
      } catch (error) {
        console.error('Assistant session error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [supabase]);

  // ---------------- dynamic page awareness ----------------
  const subtitle = useMemo(() => {
    if (loading) return 'Loading your workspace...';

    if (pathname === '/deposit') {
      return 'Need help structuring your idea for safe deposit and NDA protection?';
    }

    if (pathname === '/my-ideas') {
      return 'Review, improve, and prepare your ideas for licensing or investors.';
    }

    if (pathname.startsWith('/investor')) {
      return 'Explore breakthrough ideas and request secure NDA access.';
    }

    if (pathname.startsWith('/dashboard')) {
      return 'Admin workspace active. Review submissions and protect platform quality.';
    }

    if (role === 'inventor' && !hasIdeas) {
      return 'Let’s secure your first idea before sharing it publicly.';
    }

    if (role === 'inventor' && hasIdeas) {
      return 'Continue managing your ideas and preparing them for opportunities.';
    }

    if (role === 'investor') {
      return 'Discover breakthrough ideas from creators.';
    }

    return 'What would you like to do today?';
  }, [pathname, role, hasIdeas, loading]);

  // ---------------- dynamic CTA ----------------
  const primaryAction = useMemo(() => {
    if (loading) return null;

    if (pathname === '/deposit') {
      return {
        href: '/my-ideas',
        label: '📌 View My Deposited Ideas',
      };
    }

    if (pathname === '/my-ideas') {
      return {
        href: '/deposit',
        label: '🚀 Deposit Another Idea',
      };
    }

    if (pathname.startsWith('/investor')) {
      return {
        href: '/ideas',
        label: '🌍 Browse Public Ideas',
      };
    }

    if (role === 'inventor' && !hasIdeas) {
      return {
        href: '/deposit',
        label: '🚀 Protect My Idea',
      };
    }

    if (role === 'inventor' && hasIdeas) {
      return {
        href: '/my-ideas',
        label: '📌 Manage My Ideas',
      };
    }

    if (role === 'investor') {
      return {
        href: '/investor/ideas',
        label: '🔍 Explore Ideas',
      };
    }

    return {
      href: '/ideas',
      label: '🌍 View Public Ideas',
    };
  }, [pathname, role, hasIdeas, loading]);

  return (
    <>
      {/* Floating assistant button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full p-4 shadow-lg transition"
      >
        💡
      </button>

      {/* Assistant panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-[#0b0f1a] text-white rounded-2xl shadow-2xl border border-white/10 z-50 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Idea Assistant</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
            >
              ✖
            </button>
          </div>

         <p className="text-white/70 text-sm">
  {userName ? `Welcome ${userName}.` : 'Welcome.'} {subtitle}
</p>

         {primaryAction && (
  <Link
    href={primaryAction.href}
    className="relative z-50 inline-flex w-full items-center justify-center gap-2 text-sm px-5 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
  >
    {primaryAction.label}
  </Link>
)}
          <Link
            href="home#ideas-grid"
            className="block w-full px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            🌍 Public Idea Marketplace
          </Link>

          <div className="text-xs text-white/60 bg-white/5 p-3 rounded-lg">
            🔒 Remember: NDA ensures your idea remains protected until access is granted.
          </div>

          <a
            href="mailto:info@bankofuniqueideas.com"
            className="block w-full px-4 py-3 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-400 transition"
          >
            ⚠ Contact Admin / Report Issue
          </a>
        </div>
      )}
    </>
  );
}