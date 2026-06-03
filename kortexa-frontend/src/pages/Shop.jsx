import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { useToast } from "../components/ui/Toast";
import ProductCard from "../components/ui/ProductCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ProductFilters from "../components/ProductFilters";

export default function Shop() {
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
    api
      .get("/products/store/categories")
      .then(({ data }) => setCategories(data || []))
      .catch(console.error);
    fetchProducts("");
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchWishlistIds();
  }, [isAuthenticated, fetchWishlistIds]);

  const handleClearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("createdAt:desc");
    setSearchTerm("");
    fetchProducts("");
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
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      addToCart(product);
      showToast(`${product.name} added to cart`);
    } catch {
      showToast("Could not add item. Please try again.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="section-title">All products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} {totalCount === 1 ? "item" : "items"} in the catalog
          </p>
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchProducts(searchTerm)}
          placeholder="Filter by name..."
          className="input-field max-w-xs"
        />
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
        <LoadingSpinner label="Loading products..." />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No products found</p>
          <button type="button" onClick={handleClearFilters} className="btn-primary mt-6">
            Reset filters
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
                isAuthenticated ? (e) => handleWishlistToggle(e, product.id) : undefined
              }
              wishlisted={isWishlisted(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
