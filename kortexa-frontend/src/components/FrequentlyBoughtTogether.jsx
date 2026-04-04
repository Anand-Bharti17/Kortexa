import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function FrequentlyBoughtTogether({ productId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;
    
    const fetchFBT = async () => {
      try {
        const response = await api.get(`/products/${productId}/frequently-bought-together`);
        setProducts(response.data || []);
      } catch (error) {
        console.error("Failed to fetch frequently bought together products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFBT();
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t border-t-4 border-t-yellow-400">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Customers who bought this item also bought
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate(`/product/${product.id}`);
            }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
          >
            <div className="h-40 overflow-hidden bg-white p-2">
              <img
                src={product.imageUrl || "https://via.placeholder.com/300"}
                alt={product.name}
                className="w-full h-full object-cover rounded-md group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-blue-700 truncate group-hover:underline transition">
                {product.name}
              </h3>
              
              {product.reviewCount > 0 && (
                <div className="flex items-center mt-1">
                   <div className="flex text-xs text-yellow-400">
                     {"★".repeat(Math.round(product.averageRating))}
                     <span className="text-gray-300">{"★".repeat(5 - Math.round(product.averageRating))}</span>
                   </div>
                   <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                </div>
              )}

              <p className="font-bold text-base text-gray-900 mt-2">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
