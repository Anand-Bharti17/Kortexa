import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { useToast } from "../components/ui/Toast";
import ProductCard from "../components/ui/ProductCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { fetchWishlistIds, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const { data } = await api.get("/wishlist");
        setProducts(data || []);
        await fetchWishlistIds();
      } catch (error) {
        console.error("Failed to load wishlist", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate, fetchWishlistIds]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    try {
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      addToCart(product);
      showToast(`${product.name} added to cart`);
    } catch {
      showToast("Could not add to cart", "error");
    }
  };

  const handleToggleWishlist = async (e, productId) => {
    e.stopPropagation();
    await toggleWishlist(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast("Removed from wishlist");
  };

  if (loading) {
    return <LoadingSpinner label="Loading wishlist..." />;
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <Heart size={48} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Your wishlist is empty</h2>
        <p className="mt-2 text-slate-500">
          Tap the heart on any product to save it here.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">
          <ShoppingBag size={18} />
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title mb-2">My wishlist</h1>
      <p className="mb-8 text-sm text-slate-500">{products.length} saved items</p>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="relative">
            <ProductCard
              product={product}
              onClick={() => navigate(`/product/${product.id}`)}
              onAddToCart={(e) => handleAddToCart(e, product)}
            />
            <button
              type="button"
              onClick={(e) => handleToggleWishlist(e, product.id)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-red-500 shadow-md transition hover:scale-105"
              aria-label="Remove from wishlist"
            >
              <Heart size={18} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
