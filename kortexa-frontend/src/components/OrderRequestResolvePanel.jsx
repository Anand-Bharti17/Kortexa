import { useState } from "react";
import api from "../services/api";

export default function OrderRequestResolvePanel({ request, adminMode, onResolved }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (request.status !== "PENDING") {
    return (
      <p className="text-sm text-slate-500">
        Resolved: {request.status}
        {request.resolutionNote ? ` — ${request.resolutionNote}` : ""}
      </p>
    );
  }

  const resolve = async (approved) => {
    setLoading(true);
    setError("");
    try {
      const path = adminMode
        ? `/admin/order-requests/${request.id}/resolve`
        : `/orders/requests/${request.id}/resolve`;
      await api.patch(path, { approved, note: note.trim() || null });
      onResolved?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to resolve request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <p className="text-sm text-slate-700">
        <span className="font-medium">Reason:</span> {request.reason}
      </p>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note to customer"
        className="input-field w-full !py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => resolve(true)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => resolve(false)}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
