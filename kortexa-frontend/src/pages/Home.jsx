import { useState, useEffect, useCallback } from "react";

import { useNavigate, Link } from "react-router-dom";

import { ArrowRight } from "lucide-react";

import api from "../services/api";

import useCartStore from "../store/useCartStore";

import useAuthStore from "../store/useAuthStore";

import useWishlistStore from "../store/useWishlistStore";

import { useToast } from "../components/ui/Toast";

import ProductCard from "../components/ui/ProductCard";

import LoadingSpinner from "../components/ui/LoadingSpinner";

import RecentlyViewed from "../components/RecentlyViewed";

import TrustPerks from "../components/TrustPerks";

import ProductDiscoveryRow from "../components/ProductDiscoveryRow";
import SearchWithSuggestions from "../components/SearchWithSuggestions";



function ProductGrid({ products, onProductClick, onAddToCart, onWishlistToggle, isWishlisted }) {

  return (

    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">

      {products.map((product) => (

        <ProductCard

          key={product.id}

          product={product}

          onClick={() => onProductClick(product)}

          onAddToCart={onAddToCart ? (e) => onAddToCart(e, product) : undefined}

          onWishlistToggle={

            onWishlistToggle ? (e) => onWishlistToggle(e, product.id) : undefined

          }

          wishlisted={isWishlisted?.(product.id)}

        />

      ))}

    </div>

  );

}



export default function Home() {

  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [featuredTotal, setFeaturedTotal] = useState(0);

  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [searchResults, setSearchResults] = useState([]);

  const [searchTotal, setSearchTotal] = useState(0);

  const [searchLoading, setSearchLoading] = useState(false);

  const [hasSearched, setHasSearched] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [category, setCategory] = useState("");

  const [trending, setTrending] = useState([]);

  const [recommended, setRecommended] = useState([]);

  const [aiSearchMode, setAiSearchMode] = useState(false);

  const [aiHint, setAiHint] = useState("");

  const [aiSearching, setAiSearching] = useState(false);

  const navigate = useNavigate();

  const { showToast } = useToast();



  const addToCart = useCartStore((state) => state.addToCart);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { fetchWishlistIds, isWishlisted, toggleWishlist } = useWishlistStore();



  const fetchFeatured = useCallback(async () => {

    setFeaturedLoading(true);

    try {

      const { data } = await api.get("/products/store/featured?page=0&size=12");

      const payload = Array.isArray(data) ? data : data.content || [];

      setFeaturedProducts(payload);

      setFeaturedTotal(

        Array.isArray(data) ? payload.length : data.totalElements ?? payload.length,

      );

    } catch (error) {

      console.error("Failed to fetch featured products", error);

      setFeaturedProducts([]);

      setFeaturedTotal(0);

    } finally {

      setFeaturedLoading(false);

    }

  }, []);



  const fetchStoreResults = useCallback(async (search, searchCategory = "") => {
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (searchCategory) params.set("category", searchCategory);
      params.set("page", "0");
      params.set("size", "48");
      params.set("sortBy", "createdAt");
      params.set("sortDir", "desc");

      const response = await api.get(`/products/store?${params.toString()}`);
      const data = response.data;
      const payload = Array.isArray(data) ? data : data.content || [];
      setSearchResults(payload);
      setSearchTotal(
        Array.isArray(data) ? payload.length : data.totalElements ?? payload.length,
      );
    } catch (error) {
      console.error("Failed to fetch search results", error);
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const runSearch = useCallback(
    async (search, searchCategory = "", options = {}) => {
      const { ai = false } = options;
      if (ai && search.trim()) {
        setAiSearching(true);
        setAiHint("");
        try {
          const { data } = await api.post("/ai/search", { query: search.trim() });
          const nextCategory = data.category || "";
          const terms = data.searchTerms || search;
          setSearchTerm(terms);
          setCategory(nextCategory);
          setAiHint(data.message || "");
          await fetchStoreResults(terms, nextCategory);
        } catch (error) {
          console.error("AI search failed", error);
          showToast("AI search unavailable — using regular search", "error");
          await fetchStoreResults(search, "");
        } finally {
          setAiSearching(false);
        }
        return;
      }
      if (!options.live) setAiHint("");
      await fetchStoreResults(search, searchCategory);
    },
    [fetchStoreResults, showToast],
  );



  useEffect(() => {

    const loadDiscovery = async () => {

      try {

        const [trendRes, recRes] = await Promise.all([

          api.get("/discovery/trending?limit=8"),

          api.get("/discovery/recommended?limit=8"),

        ]);

        setTrending(trendRes.data || []);

        setRecommended(recRes.data || []);

      } catch (error) {

        console.error("Failed to load discovery", error);

      }

    };

    loadDiscovery();

    fetchFeatured();

  }, [fetchFeatured]);



  useEffect(() => {

    if (isAuthenticated) {

      fetchWishlistIds();

      api

        .get("/discovery/recommended?limit=8")

        .then(({ data }) => setRecommended(data || []))

        .catch(() => {});

    }

  }, [isAuthenticated, fetchWishlistIds]);



  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setCategory("");
    setAiHint("");
    setHasSearched(false);
    setSearchResults([]);
    setSearchTotal(0);
  }, []);



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

    } catch (error) {

      console.error("Failed to add to cart", error);

      showToast("Could not add item. Please try again.", "error");

    }

  };



  const gridProps = {

    onProductClick: (p) => navigate(`/product/${p.id}`),

    onAddToCart: handleAddToCart,

    onWishlistToggle: isAuthenticated ? handleWishlistToggle : undefined,

    isWishlisted,

  };



  return (

    <div className="space-y-8">

      <SearchWithSuggestions
        aiSearchMode={aiSearchMode}
        setAiSearchMode={setAiSearchMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        category={category}
        setCategory={setCategory}
        aiHint={aiHint}
        setAiHint={setAiHint}
        aiSearching={aiSearching}
        onSearchResults={runSearch}
        onClearSearch={clearSearch}
      />



      {hasSearched && (

        <section className="space-y-4">

          <div className="flex flex-wrap items-end justify-between gap-3">

            <div>

              <h2 className="section-title">Searched products</h2>

              <p className="mt-1 text-sm text-slate-500">

                {searchLoading

                  ? "Searching..."

                  : `${searchTotal} ${searchTotal === 1 ? "match" : "matches"}${searchTerm ? ` for “${searchTerm}”` : ""}`}

              </p>

            </div>

            <button

              type="button"

              onClick={clearSearch}

              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"

            >

              Clear search

            </button>

          </div>

          {searchLoading ? (

            <LoadingSpinner label="Searching..." />

          ) : searchResults.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">

              <p className="font-semibold text-slate-700">No products match your search</p>

              <p className="mt-2 text-sm text-slate-500">Try different keywords or browse all products.</p>

              <Link to="/shop" className="btn-primary mt-6 inline-flex">

                View all products

              </Link>

            </div>

          ) : (

            <ProductGrid products={searchResults} {...gridProps} />

          )}

        </section>

      )}



      {recommended.length > 0 && (

        <ProductDiscoveryRow

          title="Recommended for you"

          subtitle="Based on your browsing history"

          products={recommended}

          onProductClick={(p) => navigate(`/product/${p.id}`)}

          onAddToCart={handleAddToCart}

          onWishlistToggle={isAuthenticated ? handleWishlistToggle : undefined}

          isWishlisted={isWishlisted}

        />

      )}



      {trending.length > 0 && (

        <ProductDiscoveryRow

          title="Trending now"

          subtitle="Popular with shoppers this week"

          products={trending}

          onProductClick={(p) => navigate(`/product/${p.id}`)}

          onAddToCart={handleAddToCart}

          onWishlistToggle={isAuthenticated ? handleWishlistToggle : undefined}

          isWishlisted={isWishlisted}

        />

      )}



      <section className="space-y-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h2 className="section-title">Featured products</h2>

            <p className="mt-1 text-sm text-slate-500">

              Hand-picked by vendors for the homepage

              {!featuredLoading && ` · ${featuredTotal} featured`}

            </p>

          </div>

          <Link

            to="/shop"

            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"

          >

            View all products

            <ArrowRight size={16} />

          </Link>

        </div>



        {featuredLoading ? (

          <LoadingSpinner label="Loading featured products..." />

        ) : featuredProducts.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">

            <p className="font-semibold text-slate-700">No featured products yet</p>

            <p className="mt-2 text-sm text-slate-500">

              Vendors can mark items as featured when adding or editing a product.

            </p>

            <Link to="/shop" className="btn-primary mt-6 inline-flex">

              Browse full catalog

            </Link>

          </div>

        ) : (

          <ProductGrid products={featuredProducts} {...gridProps} />

        )}

      </section>



      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">

        <div>

          <h3 className="text-lg font-bold text-slate-900">Explore the full catalog</h3>

          <p className="mt-1 text-sm text-slate-600">

            Filters, sorting, and every product in one place.

          </p>

        </div>

        <Link to="/shop" className="btn-primary mt-4 shrink-0 sm:mt-0">

          Open shop

          <ArrowRight size={18} />

        </Link>

      </section>



      <TrustPerks />



      <RecentlyViewed />

    </div>

  );

}


