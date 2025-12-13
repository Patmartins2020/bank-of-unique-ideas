'use client';

export default function SynthesiaEmbed({ videoId }: { videoId: string }) {
  const src = `https://share.synthesia.io/embeds/videos/${videoId}?autoplay=1`;

  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-xl border border-white/10 shadow-lg">
      <iframe
        src={src}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}