/** Skeleton loading placeholder shown while the dashboard page data is being fetched server-side. */
export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-4xl animate-pulse">
      <div className="h-7 w-48 bg-white/5 rounded-lg mb-2" />
      <div className="h-4 w-64 bg-white/5 rounded mb-8" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
