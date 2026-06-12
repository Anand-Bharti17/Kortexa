import { formatPrice } from "../../utils/currency";

export default function PriceDisplay({
  price,
  mrp,
  size = "md",
  className = "",
}) {
  const sale = price != null ? Number(price) : 0;
  const list = mrp != null ? Number(mrp) : null;
  const showMrp = list != null && list > sale;

  const priceClass =
    size === "lg"
      ? "text-4xl font-bold"
      : size === "sm"
        ? "text-sm font-bold"
        : "text-xl font-bold";

  const mrpClass =
    size === "lg"
      ? "text-lg"
      : size === "sm"
        ? "text-xs"
        : "text-sm";

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`${priceClass} text-slate-900`}>
        {formatPrice(sale)}
      </span>
      {showMrp && (
        <>
          <span className={`${mrpClass} text-slate-400 line-through`}>
            {formatPrice(list)}
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
            {Math.round(((list - sale) / list) * 100)}% off
          </span>
        </>
      )}
    </div>
  );
}
