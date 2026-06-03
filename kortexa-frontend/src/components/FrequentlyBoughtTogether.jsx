import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import api from "../services/api";
import ProductCard from "./ui/ProductCard";

export default function FrequentlyBoughtTogether({ productId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;

    const fetchFBT = async () => {
      try {
        const response = await api.get(
          `/products/${productId}/frequently-bought-together`,
        );
        setProducts(response.data || []);
      } catch (error) {
        console.error("Failed to fetch FBT products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFBT();
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="mt-12 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Layers size={20} />
        </span>
        <h2 className="text-xl font-bold text-slate-900">
          Frequently bought together
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            compact
            onClick={() => {
              window.scrollTo(0, 0);
              navigate(`/product/${product.id}`);
            }}
          />
        ))}
      </div>
    </section>
  );
}
