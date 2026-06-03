import { useEffect, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatPrice } from "../utils/currency";
import { BRAND_NAME } from "../config/brand";

const DEBOUNCE_MS = 320;
const MIN_QUERY_LENGTH = 2;

export default function SearchWithSuggestions({
  aiSearchMode,
  setAiSearchMode,
  searchTerm,
  setSearchTerm,
  category,
  setCategory,
  aiHint,
  setAiHint,
  aiSearching,
  onSearchResults,
  onClearSearch,
}) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      if (q.length === 0) onClearSearch();
      return;
    }

    const timer = setTimeout(async () => {
      setLiveLoading(true);
      try {
        const [suggestRes] = await Promise.all([
          api.get(`/products/store/suggest?q=${encodeURIComponent(q)}&limit=6`),
          onSearchResults(q, aiSearchMode ? "" : category, { live: true }),
        ]);
        setSuggestions(suggestRes.data || []);
        setSuggestionsOpen(true);
      } catch (err) {
        console.error("Live search failed", err);
        setSuggestions([]);
      } finally {
        setLiveLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm, aiSearchMode, category, onSearchResults, onClearSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    const q = searchTerm.trim();
    if (!q) return;

    if (aiSearchMode) {
      await onSearchResults(q, category, { ai: true });
    } else {
      await onSearchResults(q, category, { live: false });
    }
  };

  const pickSuggestion = (item) => {
    setSearchTerm(item.name);
    setSuggestionsOpen(false);
    navigate(`/product/${item.id}`);
  };

  return (
    <section
      className={
        aiSearchMode
          ? "search-hero-ai-ring"
          : "search-hero-surface overflow-hidden rounded-2xl border border-indigo-100 shadow-md shadow-indigo-200/40"
      }
    >
      <div
        className={`space-y-3 p-4 sm:p-5 ${
          aiSearchMode ? "search-hero-inner search-hero-surface" : ""
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {BRAND_NAME}
            </p>
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              {aiSearchMode ? "AI-powered search" : "Search the catalog"}
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div ref={wrapperRef} className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                placeholder={
                  aiSearchMode
                    ? "e.g. kids driving toys"
                    : "Search products — results update as you type"
                }
                autoComplete="off"
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-md placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 sm:py-3"
              />
              {(liveLoading || aiSearching) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500">
                  …
                </span>
              )}
              {suggestionsOpen && suggestions.length > 0 && (
                <ul
                  className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                  role="listbox"
                >
                  {suggestions.map((item) => (
                    <li key={item.id} role="option">
                      <button
                        type="button"
                        onClick={() => pickSuggestion(item)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-indigo-50"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500">{item.category}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-indigo-700">
                          {formatPrice(item.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setAiSearchMode((v) => !v);
                if (aiSearchMode) setAiHint("");
              }}
              className={`shrink-0 rounded-xl px-3 py-2.5 shadow-sm transition sm:py-3 ${
                aiSearchMode
                  ? "bg-violet-600 text-white ring-2 ring-violet-300/80 hover:bg-violet-500"
                  : "border border-indigo-200/80 bg-white/80 text-indigo-700 hover:bg-white"
              }`}
              title="Toggle AI-assisted search"
              aria-pressed={aiSearchMode}
            >
              <Sparkles
                size={18}
                className={`mx-auto ${aiSearchMode ? "animate-pulse" : ""}`}
              />
            </button>
            <button
              type="submit"
              disabled={aiSearching}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition disabled:opacity-70 sm:py-3 ${
                aiSearchMode
                  ? "bg-gradient-to-r from-violet-400 to-fuchsia-500 text-white hover:from-violet-300 hover:to-fuchsia-400"
                  : "bg-white text-indigo-800 hover:bg-indigo-50"
              }`}
            >
              {aiSearching ? "Thinking..." : aiSearchMode ? "AI Search" : "Search"}
            </button>
          </form>
        </div>

        {aiSearchMode && (
          <p className="rounded-lg border border-indigo-100 bg-white/70 px-3 py-2 text-xs leading-relaxed text-indigo-800">
            Type to see matches instantly. Press AI Search to refine with Gemini (category +
            keywords).
          </p>
        )}
        {aiHint && (
          <p className="rounded-lg border border-violet-200 bg-white/85 px-3 py-2 text-sm text-indigo-900 shadow-sm">
            <Sparkles size={14} className="mr-1.5 inline-block align-text-bottom text-violet-600" />
            {aiHint}
          </p>
        )}
      </div>
    </section>
  );
}
