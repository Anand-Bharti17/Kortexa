import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { useToast } from "../components/ui/Toast";
import ProductCard from "../components/ui/ProductCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import RecentlyViewed from "../components/RecentlyViewed";
import TrustPerks from "../components/TrustPerks";
import ProductFilters from "../components/ProductFilters";
import { BRAND_NAME } from "../config/brand";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { fetchWishlistIds, isWishlisted, toggleWishlist } = useWishlistStore();

  const [sortBy, sortDir] = sort.split(":");

  const hasActiveFilters =
    Boolean(category || minPrice || maxPrice || sort !== "createdAt:desc");

  const fetchProducts = useCallback(
    async (search = searchTerm) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (category) params.set("category", category);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        params.set("page", "0");
        params.set("size", "48");
        params.set("sortBy", sortBy);
        params.set("sortDir", sortDir);

        const response = await api.get(`/products/store?${params.toString()}`);
        const data = response.data;
        const payload = Array.isArray(data) ? data : data.content || [];
        setProducts(payload);
        setTotalCount(
          Array.isArray(data) ? payload.length : data.totalElements ?? payload.length,
        );
      } catch (error) {
        console.error("Failed to fetch products", error);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, category, minPrice, maxPrice, sortBy, sortDir],
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/products/store/categories");
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
    fetchProducts("");
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistIds();
    }
  }, [isAuthenticated, fetchWishlistIds]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchProducts(searchTerm);
  };

  const handleClearFilters = async () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("createdAt:desc");
    setSearchTerm("");
    setLoading(true);
    try {
      const response = await api.get(
        "/products/store?page=0&size=48&sortBy=createdAt&sortDir=desc",
      );
      const data = response.data;
      const payload = Array.isArray(data) ? data : data.content || [];
      setProducts(payload);
      setTotalCount(
        Array.isArray(data) ? payload.length : data.totalElements ?? payload.length,
      );
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async (e, productId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Sign in to save items to your wishlist", "error");
      navigate("/login");
      return;
    }
    const added = await toggleWishlist(productId);
    showToast(added ? "Saved to wishlist" : "Removed from wishlist");
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

  if (loading && products.length === 0 && totalCount === 0) {
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

      <section className="space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">Featured products</h2>
            <p className="mt-1 text-sm text-slate-500">
              {totalCount} {totalCount === 1 ? "item" : "items"} available
            </p>
          </div>
        </div>

        <ProductFilters
          categories={categories}
          category={category}
          setCategory={setCategory}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sort={sort}
          setSort={setSort}
          onApply={() => fetchProducts(searchTerm)}
          onClear={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {loading ? (
          <LoadingSpinner label="Searching..." />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No products found</p>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting filters or a different search term.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
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
                onWishlistToggle={
                  isAuthenticated
                    ? (e) => handleWishlistToggle(e, product.id)
                    : undefined
                }
                wishlisted={isWishlisted(product.id)}
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
