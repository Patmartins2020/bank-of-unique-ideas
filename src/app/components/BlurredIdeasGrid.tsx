'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type IdeaPreview = {
  id: string;
  title: string;
};

export default function BlurredIdeasGrid() {
  const [ideas, setIdeas] = useState<IdeaPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIdeas = async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select('id, title')
        .eq('status', 'approved')
        .limit(6);

      if (!error && data) {
        setIdeas(data);
      }
      setLoading(false);
    };

    loadIdeas();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-white/50 text-center">
        Loading featured ideas…
      </p>
    );
  }

  if (ideas.length === 0) {
    return (
      <p className="text-sm text-white/50 text-center">
        No public ideas yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {ideas.map((idea) => (
        <div
          key={idea.id}
          className="relative rounded-lg border border-white/10 bg-white/5 p-4 overflow-hidden"
        >
          {/* Blurred content */}
          <div className="blur-sm select-none">
            <h3 className="font-semibold text-white">
              {idea.title}
            </h3>
            <p className="text-xs text-white/60 mt-2">
              Confidential idea details
            </p>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-emerald-300">
              🔒 Sign in to view
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}