'use client';

import { motion } from 'framer-motion';

export default function ResponsiveVideo({
  src,
  poster,
  className = '',
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
      className={`relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-xl border border-white/10 shadow-lg ${className}`}
    >
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
    </motion.div>
  );
}
