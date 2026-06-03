import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import api from "../services/api";
import ProductCard from "./ui/ProductCard";

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
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Clock size={20} />
        </span>
        <h2 className="section-title !text-xl sm:!text-2xl">
          Recently viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            compact
            onClick={() => navigate(`/product/${product.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
