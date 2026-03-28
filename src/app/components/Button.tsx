export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="
        px-5 py-2 rounded-xl
        bg-emerald-500
        text-black font-semibold text-sm

        transition-all duration-200

        hover:bg-emerald-400
        hover:shadow-lg hover:shadow-emerald-500/30

        active:scale-95

        border border-emerald-400/30
      "
    >
      {children}
    </button>
  );
}