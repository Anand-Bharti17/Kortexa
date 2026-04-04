import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const response = await api.get("/products/recently-viewed");
        setProducts(response.data || []);
      } catch (error) {
        console.error("Failed to fetch recently viewed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-16 bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Viewed by You</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
          >
            <div className="h-32 overflow-hidden bg-gray-100">
              <img
                src={product.imageUrl || "https://via.placeholder.com/300"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600 transition">
                {product.name}
              </h3>
              <p className="font-bold text-sm text-gray-900 mt-1">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
