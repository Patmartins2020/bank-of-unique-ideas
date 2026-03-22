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
  const [messages, setMessages] = useState<string[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const initial = [
      generateMessage(),
      generateMessage(),
      generateMessage(),
    ];
    setMessages(initial);

    const interval = setInterval(() => {
      const newMsgs = [
        generateMessage(),
        generateMessage(),
        generateMessage(),
      ];
      setMessages(newMsgs);

      // reset animation smoothly
      setKey(prev => prev + 1);

    }, 30000); // 🔥 refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const tickerText = messages.join('   •   ');

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 overflow-hidden">

      <div className="bg-black/70 backdrop-blur-md border-t border-white/10">

        <div
          key={key}
          className="whitespace-nowrap px-4 py-2 text-sm text-white/70 animate-marquee"
        >
          {tickerText} &nbsp;&nbsp;&nbsp; {tickerText}
        </div>

      </div>

      {/* SMOOTH MARQUEE */}
      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 22s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>

    </div>
  );
}