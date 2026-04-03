import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShoppingCart } from "lucide-react";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products/store");
        const payload = Array.isArray(response.data)
          ? response.data
          : response.data.content || [];
        setProducts(payload);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/products/store?search=${encodeURIComponent(searchTerm)}`,
      );
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data.content || [];
      setProducts(payload);
    } catch (error) {
      console.error("Failed to search products", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Please log in to add items to your cart!");
      return;
    }

    try {
      await api.post("/cart/add", {
        productId: product.id,
        quantity: 1,
      });

      addToCart(product);
      alert("Added to cart!");
    } catch (error) {
      console.error("Failed to add to database cart", error);
      alert("Could not add item to cart. Please try again.");
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-600 animate-pulse">
        Loading Kortexa Catalog...
      </div>
    );

  return (
    <div className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Featured Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Search and filter products across the store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products by name or description"
            className="w-full sm:w-96 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </div>
      {/* TERNARY OPERATOR STARTS HERE */}
      {products.length === 0 && !loading ? (
        <div className="text-center text-gray-500 mt-12">
          No products found. Try another search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group cursor-pointer"
            >
              <div className="h-48 overflow-hidden bg-gray-100">
                <img
                  src={product.imageUrl || "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                {/* Category Badge */}
                {product.category && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-2">
                    {product.category}
                  </span>
                )}

                {/* Product Name */}
                <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-blue-600 transition">
                  {product.name}
                </h3>
                
                {/* Rating */}
                {product.reviewCount > 0 && (
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400 text-sm">{"★".repeat(Math.round(product.averageRating))}</span>
                    <span className="text-gray-300 text-sm">{"★".repeat(5 - Math.round(product.averageRating))}</span>
                    <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-xl text-gray-900">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition active:scale-95"
                  >
                    <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}{" "}
    </div>
  );
}
