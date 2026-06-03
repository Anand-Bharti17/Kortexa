import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import { useToast } from "../components/ui/Toast";
import ProductCard from "../components/ui/ProductCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import RecentlyViewed from "../components/RecentlyViewed";
import TrustPerks from "../components/TrustPerks";
import { BRAND_NAME } from "../config/brand";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `/products/store?search=${encodeURIComponent(query)}`
        : "/products/store";
      const response = await api.get(url);
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data.content || [];
      setProducts(payload);
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchProducts(searchTerm.trim());
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Please sign in to add items to your cart", "error");
      navigate("/login");
      return;
    }

    try {
      await api.post("/cart/add", {
        productId: product.id,
        quantity: 1,
      });
      addToCart(product);
      showToast(`${product.name} added to cart`);
    } catch (error) {
      console.error("Failed to add to cart", error);
      showToast("Could not add item. Please try again.", "error");
    }
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner label="Loading catalog..." />;
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
        <div
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-500 to-transparent sm:via-violet-500/90 sm:to-white/95"
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <div className="shrink-0 sm:pr-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
              {BRAND_NAME}
            </p>
            <h1 className="text-base font-bold text-white sm:text-lg">
              Search the catalog
            </h1>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-md placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/80 sm:py-3"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50 sm:py-3"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Featured products</h2>
            <p className="mt-1 text-sm text-slate-500">
              {products.length} {products.length === 1 ? "item" : "items"} available
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Searching..." />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No products found</p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different search term or browse the full catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                fetchProducts("");
              }}
              className="btn-primary mt-6"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
                onAddToCart={(e) => handleAddToCart(e, product)}
              />
            ))}
          </div>
        )}
      </section>

      <TrustPerks />

      <RecentlyViewed />
    </div>
  );
}
