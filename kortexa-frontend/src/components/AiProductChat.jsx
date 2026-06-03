import { useState } from "react";
import { MessageCircle, Send, Loader } from "lucide-react";
import api from "../services/api";

export default function AiProductChat({ productId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const { data } = await api.post(`/ai/product/${productId}/chat`, {
        question: trimmed,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I could not answer that right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="text-indigo-600" size={20} />
        <h3 className="font-bold text-slate-900">Ask about this product</h3>
      </div>

      {messages.length > 0 && (
        <div className="mb-4 max-h-48 space-y-3 overflow-y-auto rounded-xl bg-white/80 p-3">
          {messages.map((msg, i) => (
            <p
              key={i}
              className={`text-sm ${
                msg.role === "user"
                  ? "font-medium text-indigo-800"
                  : "text-slate-700"
              }`}
            >
              {msg.role === "user" ? "You: " : "Veluno: "}
              {msg.text}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Is this good for travel?"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-primary shrink-0 px-4 py-2"
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </section>
  );
}
