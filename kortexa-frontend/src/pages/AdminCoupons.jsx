import { useState, useEffect, useCallback } from "react";
import { Tag, Plus } from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatPrice } from "../utils/currency";

export default function AdminCoupons() {
  const user = useAuthStore((state) => state.user);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "10",
    minOrderAmount: "500",
    maxUses: "100",
    active: true,
  });

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, [user]);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/coupons");
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/coupons", {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount
          ? parseFloat(form.minOrderAmount)
          : null,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
        active: form.active,
      });
      setShowForm(false);
      setForm({
        code: "",
        description: "",
        discountType: "PERCENT",
        discountValue: "10",
        minOrderAmount: "500",
        maxUses: "100",
        active: true,
      });
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await api.patch(`/admin/coupons/${coupon.id}`, {
        active: !coupon.active,
      });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed.");
    }
  };

  if (loading && coupons.length === 0) {
    return <LoadingSpinner label="Loading coupons..." />;
  }

  return (
    <div className="py-4">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Tag className="text-indigo-600" />
            Coupon management
          </h1>
          <p className="mt-1 text-gray-600">Create and enable promo codes for checkout</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          New coupon
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold text-gray-900">Create coupon</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Code *</span>
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME10"
                className="input-field mt-1 !py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Type *</span>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="input-field mt-1 !py-2 text-sm"
              >
                <option value="PERCENT">Percent off</option>
                <option value="FIXED">Fixed amount off</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Value *</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                className="input-field mt-1 !py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Min order (₹)</span>
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
                className="input-field mt-1 !py-2 text-sm"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-gray-700">Description</span>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="10% off first order"
                className="input-field mt-1 !py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-2 text-sm"
            >
              {saving ? "Creating..." : "Create coupon"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No coupons yet. Create one above.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.discountType === "PERCENT"
                      ? `${c.discountValue}%`
                      : formatPrice(c.discountValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.minOrderAmount ? formatPrice(c.minOrderAmount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
