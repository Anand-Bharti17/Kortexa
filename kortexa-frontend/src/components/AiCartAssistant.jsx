import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import { formatPrice } from "../utils/currency";

export default function AiCartAssistant() {
  const addToCart = useCartStore((state) => state.addToCart);
  const [budget, setBudget] = useState("2000");
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSuggest = async () => {
    const amount = parseFloat(budget);
    if (!amount || amount < 1) {
      setError("Enter a valid budget in INR.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/cart-suggest", {
        budget: amount,
        occasion: occasion.trim() || null,
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not generate suggestions.",
      );
    } finally {
      setLoading(false);
    }
  };

  const addAll = () => {
    (result?.products || []).forEach((p) => addToCart(p, 1));
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <Sparkles size={18} className="text-indigo-600" />
        AI gift assistant
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Build a bundle under your budget — great for gifts and occasions.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          min="1"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget (₹)"
          className="input-field flex-1 !py-2 text-sm"
        />
        <input
          type="text"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Occasion (optional)"
          className="input-field flex-1 !py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={loading}
          className="btn-primary !py-2 text-sm whitespace-nowrap"
        >
          {loading ? "Thinking..." : "Suggest bundle"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-indigo-800">{result.message}</p>
          {(result.products || []).length > 0 ? (
            <>
              <ul className="space-y-2">
                {result.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{p.name}</span>
                    <span className="text-slate-600">{formatPrice(p.price)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addAll}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                Add bundle to cart
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
