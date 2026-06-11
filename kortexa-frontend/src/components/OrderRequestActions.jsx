import { useState } from "react";
import api from "../services/api";

export default function OrderRequestActions({
  orderId,
  orderStatus,
  pendingRequest,
  onSubmitted,
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCancel = orderStatus === "PAID" && !pendingRequest;
  const canReturn = orderStatus === "DELIVERED" && !pendingRequest;

  if (!canCancel && !canReturn && !pendingRequest) {
    return null;
  }

  if (pendingRequest) {
    return (
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {pendingRequest.requestType} request pending — {pendingRequest.status}
      </p>
    );
  }

  const openModal = (requestType) => {
    setType(requestType);
    setReason("");
    setError("");
    setOpen(true);
  };

  const submit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const path =
        type === "CANCEL"
          ? `/orders/${orderId}/requests/cancel`
          : `/orders/${orderId}/requests/return`;
      await api.post(path, { reason: reason.trim() });
      setOpen(false);
      onSubmitted?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Request failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {canCancel && (
          <button
            type="button"
            onClick={() => openModal("CANCEL")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Request cancellation
          </button>
        )}
        {canReturn && (
          <button
            type="button"
            onClick={() => openModal("RETURN")}
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            Request return
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {type === "CANCEL" ? "Cancel order" : "Return order"} #{orderId}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Tell us why you want to {type === "CANCEL" ? "cancel" : "return"} this order.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="input-field mt-4 w-full"
              placeholder="Reason for request..."
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="btn-primary !py-2 text-sm"
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
