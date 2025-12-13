'use client';

import { motion } from 'framer-motion';

type Props = {
  src?: string;          // for local videos
  poster?: string;
  embedUrl?: string;     // for Synthesia / iframe videos
  className?: string;
};

export default function ResponsiveVideo({
  src,
  poster,
  embedUrl,
  className = '',
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      className={`relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-xl border border-white/10 shadow-lg bg-black ${className}`}
    >
      {embedUrl ? (
        // 🔹 Synthesia / iframe video
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="encrypted-media; fullscreen"
          loading="lazy"
          style={{ border: 0 }}
        />
      ) : (
        // 🔹 Local video fallback
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="h-full w-full object-cover"
        />
      )}
    </motion.div>
  );
}