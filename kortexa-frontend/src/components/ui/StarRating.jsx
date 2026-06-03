export default function StarRating({ rating = 0, reviewCount, size = "sm" }) {
  const starClass = size === "lg" ? "text-xl" : "text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${starClass}`}>
        {[1, 2, 3, 4, 5].map((i) => {
          let fillPct = 0;
          if (rating >= i) fillPct = 100;
          else if (rating > i - 1) fillPct = (rating - (i - 1)) * 100;

          return (
            <div key={i} className="relative inline-block text-slate-200">
              ★
              <div
                className="absolute top-0 left-0 overflow-hidden text-amber-400"
                style={{ width: `${fillPct}%` }}
              >
                ★
              </div>
            </div>
          );
        })}
      </div>
      {reviewCount > 0 && (
        <>
          <span className="text-xs font-bold text-slate-700">
            {Number(rating).toFixed(1)}
          </span>
          <span className="text-xs text-slate-500">({reviewCount})</span>
        </>
      )}
    </div>
  );
}
