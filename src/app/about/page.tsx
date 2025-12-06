// app/about/page.tsx

export default function AboutPage() {
  return (
    <main
      className="
        min-h-screen
        px-6 py-12
        bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900
        text-white
      "
    >
      <section className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-emerald-400">
          About Bank of Unique Ideas
        </h1>

        <p className="text-white/80 mb-6">
          Bank of Unique Ideas is a curated bridge between inventors,
          innovators, and impact-driven investors. We provide a protected
          environment where early-stage concepts can be evaluated, refined and
          prepared for real-world funding and partnerships.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold mb-2 text-emerald-300">
              For Inventors & Innovators
            </h2>
            <p className="text-sm text-white/80">
              Submit your ideas, receive structured feedback, and get visibility
              in front of investors who are actively looking for purposeful
              innovations. Sensitive details stay protected behind NDAs and
              timestamped records.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold mb-2 text-emerald-300">
              For Investors & Partners
            </h2>
            <p className="text-sm text-white/80">
              Explore a pipeline of vetted opportunities from diverse creators
              across the world. Filter by theme, stage and impact area, then
              connect under clear, transparent collaboration terms.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="text-lg font-semibold mb-2 text-emerald-300">
            Our Vision
          </h2>
          <p className="text-sm text-white/80">
            To become the global reference point where serious ideas are safely
            housed, fairly presented, and connected to the right capital and
            expertise — especially for creators who do not normally have access
            to such opportunities.
          </p>
        </div>
      </section>
    </main>
  );
}
