import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShoppingCart } from "lucide-react";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Featured Products</h1>
      </div>

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
    </div>
  );
}
