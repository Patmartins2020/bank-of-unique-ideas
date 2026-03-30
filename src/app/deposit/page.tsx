'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import DepositIntelligencePanel from '@/components/DepositIntelligencePanel';
import { useDepositIntelligence } from '@/hooks/useDepositIntelligence';

export default function DepositPage() {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const intelligence = useDepositIntelligence(title, description);

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setMessage('You must be logged in to submit an idea.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('ideas').insert({
        user_id: data.user.id,
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category,
        status: 'pending',
      });

      if (error) throw error;

      setTitle('');
      setTagline('');
      setDescription('');
      setCategory('General');

      setMessage('✅ Your idea has been deposited successfully.');
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong.');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* LEFT SIDE — FORM */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-3">Deposit Your Idea</h1>

          <p className="text-white/70 mb-8">
            Secure proof of existence for your innovation by depositing it
            in the Global Bank of Unique Ideas.
          </p>

          {/* Protection box */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-5 mb-8">
            <h3 className="text-lg font-semibold text-emerald-300 mb-3">
              Your Idea Is Protected
            </h3>

            <ul className="space-y-2 text-sm text-white/80">
              <li>✓ Unique Verification Code</li>
              <li>✓ Cryptographic Hash Lock</li>
              <li>✓ Timestamped Proof of Existence</li>
              <li>✓ Downloadable Deposit Certificate</li>
              <li>✓ Secure Inventor Record</li>
            </ul>
          </div>

          {/* Deposit form */}
          <form
            onSubmit={submitIdea}
            className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6"
          >
            {/* Title */}
            <div>
              <label className="text-sm text-white/80">Idea Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-3 rounded-md bg-black/40 border border-white/10"
                placeholder="Example: Smart Helmet for Motorcycle Safety"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="text-sm text-white/80">Short Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full mt-1 p-3 rounded-md bg-black/40 border border-white/10"
                placeholder="One sentence describing the idea"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-white/80">Description</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 p-3 rounded-md bg-black/40 border border-white/10"
                placeholder="Explain the problem your idea solves..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-white/80">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 p-3 rounded-md bg-black/40 border border-white/10"
              >
                <option>General</option>
                <option>Technology</option>
                <option>Health</option>
                <option>Education</option>
                <option>Environment</option>
                <option>Transport</option>
              </select>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full py-3 rounded-md bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              {loading ? 'Depositing...' : '🚀 Deposit Idea'}
            </button>

            {/* Message */}
            {message && (
              <p className="text-sm text-center text-emerald-300">
                {message}
              </p>
            )}
          </form>
        </div>

        {/* RIGHT SIDE — SIGNATURE MOAT */}
        <DepositIntelligencePanel {...intelligence} />
      </div>
    </main>
  );
}