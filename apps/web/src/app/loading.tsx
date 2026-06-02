export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 animate-pulse">
      <header className="border-b border-white/5 h-14" />
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* Creator card */}
        <div className="bg-[#111] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-white/5 rounded-full w-28" />
              <div className="h-2.5 bg-white/5 rounded-full w-20" />
            </div>
          </div>
          <div className="h-8 bg-white/4 rounded-xl" />
          <div className="h-8 bg-white/4 rounded-xl" />
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#111] rounded-xl h-14" />
          ))}
        </div>
        {/* Feed */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-[#111] border border-white/5 rounded-2xl p-4 space-y-2"
          >
            <div className="h-3 bg-white/5 rounded-full w-full" />
            <div className="h-3 bg-white/5 rounded-full w-4/5" />
            <div className="h-3 bg-white/5 rounded-full w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
