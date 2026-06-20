export default function InboxLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* TOP BAR */}
      <header className="border-b border-white/5 h-14" />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3 animate-pulse">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-1 rounded-xl h-14" />
          ))}
        </div>

        {/* Search */}
        <div className="bg-surface-1 rounded-xl h-10 mb-3" />

        {/* Tabs */}
        <div className="bg-surface-1 rounded-xl h-10 mb-4" />

        {/* Message cards */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-1 border border-white/5 rounded-2xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/5" />
              <div className="h-3 bg-white/5 rounded-full w-24" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-white/5 rounded-full w-full" />
              <div className="h-3 bg-white/5 rounded-full w-4/5" />
              <div className="h-3 bg-white/5 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
