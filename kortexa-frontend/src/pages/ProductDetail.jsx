import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShoppingCart, ArrowLeft, Loader } from "lucide-react";
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

  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
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

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

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
    </div>
  );
}
