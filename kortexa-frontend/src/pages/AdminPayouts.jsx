import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatPrice } from "../utils/currency";

const PAGE_SIZE = 10;

export default function AdminPayouts() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, [user]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/payout-requests", {
        params: { page, size: PAGE_SIZE, status: statusFilter || undefined },
      });
      setRequests(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resolve = async (id, approved) => {
    setResolving(id);
    try {
      await api.patch(`/admin/payout-requests/${id}/resolve`, {
        approved,
        note: notes[id]?.trim() || null,
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to resolve payout.");
    } finally {
      setResolving(null);
    }
  };

  if (loading && requests.length === 0) {
    return <LoadingSpinner label="Loading payout requests..." />;
  }

  return (
    <div className="py-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Wallet className="text-violet-600" />
            Vendor payouts
          </h1>
          <p className="mt-1 text-gray-600">Approve or reject vendor withdrawal requests</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          No payout requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(req.amount)}
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {req.status}
                </span>
                <span className="text-sm text-gray-500">
                  {req.createdAt
                    ? format(new Date(req.createdAt), "MMM d, yyyy · h:mm a")
                    : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                Vendor: <strong>{req.vendorEmail}</strong>
              </p>
              {req.paymentNote && (
                <p className="mt-1 text-sm text-gray-600">
                  Payment details: {req.paymentNote}
                </p>
              )}
              {req.status === "PENDING" ? (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  <input
                    type="text"
                    placeholder="Optional admin note"
                    value={notes[req.id] || ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [req.id]: e.target.value }))
                    }
                    className="input-field w-full !py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={resolving === req.id}
                      onClick={() => resolve(req.id, true)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve & deduct
                    </button>
                    <button
                      type="button"
                      disabled={resolving === req.id}
                      onClick={() => resolve(req.id, false)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                req.resolutionNote && (
                  <p className="mt-2 text-sm text-gray-500">
                    Note: {req.resolutionNote}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
