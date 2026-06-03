import { ShoppingCart, Heart } from "lucide-react";
import StarRating from "./StarRating";
import { formatPrice } from "../../utils/currency";

export default function ProductCard({
  product,
  onClick,
  onAddToCart,
  onWishlistToggle,
  wishlisted = false,
  compact = false,
}) {
  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm card-hover ${
        compact ? "" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-slate-100 ${
          compact ? "aspect-square" : "aspect-[4/3]"
        }`}
      >
        <img
          src={product.imageUrl || "https://via.placeholder.com/400"}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-sm">
              Featured
            </span>
          )}
          {product.category && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={onWishlistToggle}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-md transition hover:scale-105"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={18}
              className={wishlisted ? "fill-red-500 text-red-500" : "text-slate-500"}
            />
          </button>
        )}
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <h3
          className={`font-semibold text-slate-900 transition group-hover:text-indigo-600 ${
            compact ? "truncate text-sm" : "line-clamp-2 text-base"
          }`}
        >
          {product.name}
        </h3>

        {product.reviewCount > 0 && (
          <div className="mt-2">
            <StarRating
              rating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`font-bold text-slate-900 ${
              compact ? "text-sm" : "text-xl"
            }`}
          >
            {formatPrice(product.price)}
          </span>
          {onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
            >
              <ShoppingCart size={compact ? 16 : 18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
