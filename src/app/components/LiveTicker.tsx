'use client';

import { useEffect, useState } from 'react';

const countries = ['Germany', 'USA', 'Nigeria', 'UK', 'Canada', 'India'];
const categories = [
  'Smart Security',
  'Mobility',
  'Home & Lifestyle',
  'Eco Innovation',
];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage() {
  const types = ['idea', 'investor', 'certificate', 'approval'];
  const type = getRandom(types);

  switch (type) {
    case 'idea':
      return `🟢 New idea submitted in ${getRandom(categories)}`;
    case 'investor':
      return `💼 Investor joined from ${getRandom(countries)}`;
    case 'certificate':
      return `📄 Certificate issued successfully`;
    case 'approval':
      return `🚀 Idea approved and verified`;
    default:
      return `🌍 New activity detected`;
  }
}

export default function LiveTicker() {
  const [messages, setMessages] = useState<string[]>([
    '🌍 Loading activity...',
  ]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const generateBatch = () => [
      generateMessage(),
      generateMessage(),
      generateMessage(),
    ];

    setMessages(generateBatch());

    const interval = setInterval(() => {
      setMessages(generateBatch());
    }, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  const tickerText = messages.join('   •   ');

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 overflow-hidden bg-black/70 backdrop-blur-md border-t border-white/10">

      <div
        className="whitespace-nowrap px-4 py-2 text-sm text-white/70"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: 'tickerMove 25s linear infinite',
        }}
      >
        {tickerText} &nbsp;&nbsp;&nbsp; {tickerText}
      </div>

      {/* GLOBAL STYLE (SAFE) */}
      <style>{`
        @keyframes tickerMove {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

    </div>
  );
}