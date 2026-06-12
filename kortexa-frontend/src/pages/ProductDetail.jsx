import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Loader,
  Sparkles,
  Store,
  Heart,
  BadgeCheck,
} from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { useToast } from "../components/ui/Toast";
import StarRating from "../components/ui/StarRating";
import PriceDisplay from "../components/ui/PriceDisplay";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import RecentlyViewed from "../components/RecentlyViewed";
import FrequentlyBoughtTogether from "../components/FrequentlyBoughtTogether";
import AiProductChat from "../components/AiProductChat";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSummary, setReviewSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  const addToCart = useCartStore((state) => state.addToCart);
  const { isAuthenticated, userRole } = useAuthStore();
  const { fetchWishlistIds, isWishlisted, toggleWishlist } = useWishlistStore();

  const selectedVariant = useMemo(
    () => product?.variants?.find((v) => v.id === selectedVariantId) ?? null,
    [product, selectedVariantId],
  );

  const displayPrice = selectedVariant?.effectivePrice ?? product?.price;
  const hasVariants = (product?.variants?.length ?? 0) > 0;
  const availableStock = hasVariants
    ? selectedVariant?.stockQuantity ?? 0
    : product?.stockQuantity ?? 0;

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistIds();
    }
  }, [isAuthenticated, fetchWishlistIds]);

  useEffect(() => {
    if (product?.variants?.length === 1) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");
      setSelectedVariantId(null);
      setActiveImage(0);
      const [productRes, reviewsRes] = await Promise.all([
        api.get(`/products/${id}/detail`),
        api.get(`/reviews/product/${id}`),
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
      if (reviewsRes.data.length >= 2) fetchReviewSummary();
    } catch (err) {
      console.error("Failed to fetch product details", err);
      setError("Product not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get(`/reviews/product/${id}/summary`);
      setReviewSummary(res.data.summary);
    } catch (err) {
      console.error("Failed to fetch AI review summary", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast("Please sign in to add items to your cart", "error");
      navigate("/login");
      return;
    }

    if (hasVariants && !selectedVariantId) {
      showToast("Please select a variant", "error");
      return;
    }

    try {
      setAdding(true);
      const payload = {
        productId: product.id,
        quantity: parseInt(quantity, 10),
      };
      if (selectedVariantId) {
        payload.variantId = selectedVariantId;
      }
      await api.post("/cart/add", payload);
      addToCart(
        { ...product, price: displayPrice, variantId: selectedVariantId },
        quantity,
      );
      showToast(`Added ${quantity} item(s) to cart`);
    } catch (err) {
      console.error("Failed to add to cart", err);
      showToast(
        err.response?.data?.error || "Could not add item. Please try again.",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim() || newReview.rating === 0) {
      showToast("Please add a rating and comment", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/reviews/product/${id}`, newReview);
      await fetchProductDetails();
      setNewReview({ rating: 0, comment: "" });
      showToast("Review submitted successfully");
    } catch (err) {
      console.error("Failed to add review", err);
      showToast("Error submitting review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading product..." />;
  }

  if (error || !product) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={18} />
          Back to shop
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const gallery =
    product.galleryImages?.length > 0
      ? product.galleryImages
      : [product.imageUrl || "https://via.placeholder.com/600"];

  const stockPct = Math.min((availableStock / 100) * 100, 100);
  const inStock = availableStock > 0;
  const canAdd = inStock && (!hasVariants || selectedVariantId);

  return (
    <div className="space-y-12">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
      >
        <ArrowLeft size={18} />
        Back to products
      </button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="aspect-square bg-slate-100 sm:aspect-[4/3] lg:aspect-square">
            <img
              src={gallery[activeImage]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">
              {gallery.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === idx
                      ? "border-indigo-600"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <span className="mb-3 inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {product.category}
            </span>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>
            {isAuthenticated && userRole === "CUSTOMER" && (
              <button
                type="button"
                onClick={async () => {
                  const added = await toggleWishlist(product.id);
                  showToast(added ? "Saved to wishlist" : "Removed from wishlist");
                }}
                className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
                aria-label="Toggle wishlist"
              >
                <Heart
                  size={22}
                  className={
                    isWishlisted(product.id)
                      ? "fill-red-500 text-red-500"
                      : "text-slate-400"
                  }
                />
              </button>
            )}
          </div>

          {product.reviewCount > 0 && (
            <div className="mt-3">
              <StarRating
                rating={product.averageRating}
                reviewCount={product.reviewCount}
                size="lg"
              />
            </div>
          )}

          <div className="mt-6">
            <PriceDisplay
              price={displayPrice}
              mrp={product.mrp}
              size="lg"
            />
            {selectedVariant?.priceAdjustment != null &&
              Number(selectedVariant.priceAdjustment) !== 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  Includes variant adjustment of{" "}
                  {Number(selectedVariant.priceAdjustment) > 0 ? "+" : ""}
                  ₹{selectedVariant.priceAdjustment}
                </p>
              )}
          </div>

          {hasVariants && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Select option
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const out = v.stockQuantity <= 0;
                  const selected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={out}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : out
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      {v.label}
                      {v.size ? ` · ${v.size}` : ""}
                      {v.color ? ` · ${v.color}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Availability</span>
              <span
                className={`font-bold ${inStock ? "text-emerald-600" : "text-red-600"}`}
              >
                {hasVariants && !selectedVariantId
                  ? "Select a variant"
                  : inStock
                    ? `${availableStock} in stock`
                    : "Out of stock"}
              </span>
            </div>
            {canAdd && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    availableStock > 10
                      ? "bg-emerald-500"
                      : availableStock > 0
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${stockPct}%` }}
                />
              </div>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-slate-600">
            {product.description ||
              "No description available for this product."}
          </p>

          {product.vendorEmail && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
              <Store size={20} className="text-indigo-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Sold by
                </p>
                <p className="truncate text-sm font-medium text-slate-800">
                  {product.vendorEmail}
                </p>
                {product.vendorReviewCount > 0 && (
                  <div className="mt-1">
                    <StarRating
                      rating={product.vendorAverageRating}
                      reviewCount={product.vendorReviewCount}
                      size="sm"
                    />
                    <p className="text-[10px] text-slate-500">
                      Seller rating across all products
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!canAdd}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          availableStock || 1,
                          parseInt(e.target.value, 10) || 1,
                        ),
                      ),
                    )
                  }
                  min={1}
                  max={availableStock || 1}
                  disabled={!canAdd}
                  className="w-14 border-x border-slate-200 py-3 text-center focus:outline-none disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(availableStock || 1, quantity + 1),
                    )
                  }
                  disabled={!canAdd}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-slate-500">
                {quantity > 1 ? `${quantity} items` : "1 item"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAdd || adding}
              className="btn-primary w-full !py-3.5"
            >
              {adding ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Add to cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AiProductChat productId={id} />
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8">
        <h2 className="section-title mb-6">Customer reviews</h2>

        {(reviewSummary || loadingSummary) && (
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
            <div className="mb-2 flex items-center gap-2 font-bold text-indigo-900">
              <Sparkles size={20} className="text-indigo-600" />
              AI review summary
            </div>
            {loadingSummary ? (
              <p className="animate-pulse text-indigo-700">
                Generating insights...
              </p>
            ) : (
              <p className="leading-relaxed text-indigo-900/90">
                {reviewSummary}
              </p>
            )}
          </div>
        )}

        {isAuthenticated && userRole === "CUSTOMER" && (
          <form
            onSubmit={handleAddReview}
            className="mb-8 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/80 p-6"
          >
            <h3 className="mb-4 font-bold text-slate-900">Write a review</h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setNewReview({ ...newReview, rating: star })
                    }
                    className={`text-2xl transition ${
                      newReview.rating >= star
                        ? "text-amber-400"
                        : "text-slate-300 hover:text-amber-200"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              rows={3}
              className="input-field mb-4"
              placeholder="Share your experience with this product..."
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="btn-primary"
            >
              {submittingReview ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}

        <div className="space-y-4 max-w-3xl">
          {reviews.length === 0 ? (
            <p className="text-slate-500 italic">
              No reviews yet. Be the first!
            </p>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                      {review.customer?.name?.[0]?.toUpperCase() ||
                        review.customer?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {review.customer?.name || review.customer?.email}
                        </p>
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            <BadgeCheck size={12} />
                            Verified purchase
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-amber-400">
                    {"★".repeat(review.rating)}
                    <span className="text-slate-200">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-slate-700">{review.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <FrequentlyBoughtTogether productId={product.id} />
      <RecentlyViewed />
    </div>
  );
}
