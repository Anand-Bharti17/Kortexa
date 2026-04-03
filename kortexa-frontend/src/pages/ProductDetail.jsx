import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShoppingCart, ArrowLeft, Loader, Star } from "lucide-react";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const { isAuthenticated, userRole } = useAuthStore();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const [productRes, reviewsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`)
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error("Failed to fetch product details", err);
      setError("Product not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Please log in to add items to your cart!");
      navigate("/login");
      return;
    }

    try {
      setAdding(true);
      await api.post("/cart/add", {
        productId: product.id,
        quantity: parseInt(quantity),
      });

      addToCart(product, quantity);
      alert("Added to cart successfully!");
    } catch (err) {
      console.error("Failed to add to cart", err);
      alert("Could not add item to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;
    
    setSubmittingReview(true);
    try {
      const response = await api.post(`/reviews/product/${id}`, newReview);
      setReviews([response.data, ...reviews]);
      setNewReview({ rating: 5, comment: "" });
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Failed to add review", error);
      alert("Error submitting review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-600 animate-pulse">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Products
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden h-96 md:h-full">
          <img
            src={product.imageUrl || "https://via.placeholder.com/600"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Category Badge */}
            {product.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {product.category}
              </span>
            )}

            {/* Title & Rating */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            {product.reviewCount > 0 && (
              <div className="flex items-center mb-4">
                <div className="flex mr-2 text-xl">
                  {[1, 2, 3, 4, 5].map((i) => {
                    let fillPct = 0;
                    if (product.averageRating >= i) fillPct = 100;
                    else if (product.averageRating > i - 1) fillPct = (product.averageRating - (i - 1)) * 100;
                    return (
                      <div key={i} className="relative inline-block text-gray-200">
                        ★
                        <div className="absolute top-0 left-0 overflow-hidden text-yellow-400" style={{ width: `${fillPct}%` }}>
                          ★
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-sm font-bold text-gray-800 mr-1">{product.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">Price</p>
              <p className="text-4xl font-bold text-gray-900">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Stock Available</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      product.stockQuantity > 10
                        ? "bg-green-500"
                        : product.stockQuantity > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (product.stockQuantity / 100) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <span
                  className={`ml-4 font-bold text-lg ${
                    product.stockQuantity > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} in stock`
                    : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm font-semibold mb-2">
                Description
              </p>
              <p className="text-gray-700 text-base leading-relaxed">
                {product.description ||
                  "No description available for this product."}
              </p>
            </div>

            {/* Vendor Information */}
            {product.vendorEmail && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-900 text-sm font-semibold">
                  Sold by
                </p>
                <p className="text-blue-700 text-lg">
                  {product.vendorEmail}
                </p>
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stockQuantity === 0}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                          product.stockQuantity,
                          parseInt(e.target.value) || 1
                        )
                      )
                    )
                  }
                  min="1"
                  max={product.stockQuantity}
                  className="w-16 text-center py-2 border-l border-r border-gray-300 focus:outline-none"
                />
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(product.stockQuantity, quantity + 1)
                    )
                  }
                  disabled={product.stockQuantity === 0}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  +
                </button>
              </div>
              <span className="text-gray-600 text-sm">
                {quantity > 1 ? `${quantity} items` : "1 item"}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0 || adding}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {adding ? (
                <>
                  <Loader size={20} className="mr-2 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} className="mr-2" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Customer Reviews</h2>
        
        {isAuthenticated && userRole === "CUSTOMER" && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleAddReview}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`text-2xl transition ${newReview.rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Review Comment</label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="What did you think of this product?"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-6 max-w-3xl">
          {reviews.length === 0 ? (
            <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {review.customer?.name?.[0]?.toUpperCase() || review.customer?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{review.customer?.name || review.customer?.email}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex text-yellow-400 text-sm">
                    {"★".repeat(review.rating)}
                    <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
