import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import OrderRequestResolvePanel from "../components/OrderRequestResolvePanel";

const PAGE_SIZE = 10;

export default function AdminOrderRequests() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, [user]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/order-requests", {
        params: { page, size: PAGE_SIZE, status: statusFilter || undefined },
      });
      setRequests(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Failed to load order requests", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading && requests.length === 0) {
    return <LoadingSpinner label="Loading requests..." />;
  }

  return (
    <div className="py-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order requests</h1>
          <p className="mt-1 text-gray-600">
            Cancellations and returns awaiting resolution
          </p>
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
          No requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <RotateCcw size={18} className="text-violet-600" />
                <span className="font-semibold text-gray-900">
                  {req.requestType} · Order #{req.orderId}
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {req.status}
                </span>
                <span className="text-sm text-gray-500">
                  {req.createdAt
                    ? format(new Date(req.createdAt), "MMM d, yyyy")
                    : ""}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Customer: {req.customerEmail} · Order status: {req.orderStatus}
              </p>
              <OrderRequestResolvePanel
                request={req}
                adminMode
                onResolved={fetchRequests}
              />
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
