export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
