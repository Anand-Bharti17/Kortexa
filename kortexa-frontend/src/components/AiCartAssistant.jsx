import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import api from "../services/api";
import useCartStore from "../store/useCartStore";
import { formatPrice } from "../utils/currency";

const inputClass =
  "box-border h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15";

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
    <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
          <Sparkles size={18} className="shrink-0 text-indigo-600" />
          AI gift assistant
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Build a bundle under your budget — great for gifts and occasions.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="ai-gift-budget" className="text-xs font-semibold text-slate-700">
              Budget (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="ai-gift-budget"
              type="number"
              min="1"
              step="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="2000"
              className={inputClass}
            />
            <p className="text-xs leading-snug text-slate-500">
              Max bundle total in INR.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="ai-gift-occasion" className="text-xs font-semibold text-slate-700">
              Occasion{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="ai-gift-occasion"
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Birthday gift, anniversary…"
              className={inputClass}
            />
            <p className="text-xs leading-snug text-slate-500">
              Helps pick relevant products.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSuggest}
          disabled={loading}
          className="btn-primary h-11 w-full text-sm sm:w-fit sm:min-w-[10rem]"
        >
          {loading ? "Thinking..." : "Suggest bundle"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 space-y-3 border-t border-indigo-100 pt-5">
          <p className="text-sm font-medium leading-relaxed text-indigo-900">
            {result.message}
          </p>
          {(result.products || []).length > 0 ? (
            <>
              <ul className="space-y-2">
                {result.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                      {p.name}
                    </span>
                    <span className="shrink-0 font-medium text-slate-600">
                      {formatPrice(p.price)}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addAll}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto sm:px-5"
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
