import { useState, useEffect } from "react";
import api from "../services/api";
import {
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Activity,
  RefreshCw,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";

export default function AdminDashboard() {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [activeVendors, setActiveVendors] = useState([]);
  const [suspendedVendors, setSuspendedVendors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const activityTypeStyles = {
    USER_REGISTERED: "bg-blue-100 text-blue-800",
    USER_LOGIN: "bg-slate-100 text-slate-700",
    ORDER_PLACED: "bg-amber-100 text-amber-800",
    ORDER_PAID: "bg-emerald-100 text-emerald-800",
    ORDER_STATUS_CHANGED: "bg-violet-100 text-violet-800",
    PRODUCT_CREATED: "bg-indigo-100 text-indigo-800",
    REVIEW_POSTED: "bg-pink-100 text-pink-800",
    VENDOR_APPROVED: "bg-green-100 text-green-800",
    VENDOR_SUSPENDED: "bg-red-100 text-red-800",
    VENDOR_REACTIVATED: "bg-cyan-100 text-cyan-800",
    COUPON_APPLIED: "bg-orange-100 text-orange-800",
    ADDRESS_SAVED: "bg-teal-100 text-teal-800",
    COUPON_CREATED: "bg-purple-100 text-purple-800",
  };

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      alert("Access Denied: Admin privileges required");
      window.location.href = "/";
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const { data } = await api.get("/admin/activity", {
        params: { page: 0, size: 30 },
      });
      setActivity(data.content || []);
    } catch (err) {
      console.error("Failed to fetch activity", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const [pendingRes, activeRes, suspendedRes, statsRes] = await Promise.all([
        api.get("/admin/vendors/pending"),
        api.get("/admin/vendors/active"),
        api.get("/admin/vendors/suspended"),
        api.get("/admin/vendors/stats"),
      ]);
      setPendingVendors(pendingRes.data);
      setActiveVendors(activeRes.data);
      setSuspendedVendors(suspendedRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendor = async (vendorId) => {
    if (!window.confirm("Are you sure you want to approve this vendor?")) {
      return;
    }

    try {
      setProcessing((prev) => ({ ...prev, [vendorId]: true }));
      await api.post(`/admin/vendors/${vendorId}/approve`);

      setPendingVendors((prev) =>
        prev.filter((vendor) => vendor.id !== vendorId)
      );
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        active: prev.active + 1,
      }));
      alert("Vendor approved successfully!");
      fetchActivity();
    } catch (err) {
      console.error("Failed to approve vendor", err);
      alert(
        "Error: " + (err.response?.data?.error || "Failed to approve vendor")
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleSuspendVendor = async (vendorId) => {
    if (!window.confirm("Are you sure you want to suspend this vendor?")) {
      return;
    }

    try {
      setProcessing((prev) => ({ ...prev, [vendorId]: true }));
      await api.post(`/admin/vendors/${vendorId}/suspend`);

      const suspendedVendor = activeVendors.find((v) => v.id === vendorId);
      setActiveVendors((prev) =>
        prev.filter((vendor) => vendor.id !== vendorId)
      );
      if (suspendedVendor) {
        setSuspendedVendors((prev) => [...prev, suspendedVendor]);
      }
      setStats((prev) => ({
        ...prev,
        active: prev.active - 1,
        suspended: (prev.suspended || 0) + 1,
      }));
      alert("Vendor suspended successfully!");
      fetchActivity();
    } catch (err) {
      console.error("Failed to suspend vendor", err);
      alert(
        "Error: " + (err.response?.data?.error || "Failed to suspend vendor")
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleReactivateVendor = async (vendorId) => {
    if (!window.confirm("Are you sure you want to reactivate this vendor?")) {
      return;
    }

    try {
      setProcessing((prev) => ({ ...prev, [vendorId]: true }));
      await api.post(`/admin/vendors/${vendorId}/reactivate`);

      const reactivatedVendor = suspendedVendors.find((v) => v.id === vendorId);
      setSuspendedVendors((prev) =>
        prev.filter((vendor) => vendor.id !== vendorId)
      );
      if (reactivatedVendor) {
        setActiveVendors((prev) => [...prev, reactivatedVendor]);
      }
      setStats((prev) => ({
        ...prev,
        suspended: (prev.suspended || 1) - 1,
        active: prev.active + 1,
      }));
      alert("Vendor reactivated successfully!");
      fetchActivity();
    } catch (err) {
      console.error("Failed to reactivate vendor", err);
      alert(
        "Error: " +
          (err.response?.data?.error || "Failed to reactivate vendor")
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [vendorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-600 animate-pulse">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage vendor approvals and monitor platform activity
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={22} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent activity</h2>
          </div>
          <button
            type="button"
            onClick={fetchActivity}
            disabled={activityLoading}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={activityLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {activityLoading && activity.length === 0 ? (
          <p className="text-center text-gray-500 py-8 animate-pulse">
            Loading activity...
          </p>
        ) : activity.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No activity recorded yet. Events will appear here as users interact with the platform.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {activity.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    activityTypeStyles[event.eventType] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {event.eventType?.replace(/_/g, " ")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {event.actorEmail || "System"}
                    {event.actorRole ? ` · ${event.actorRole}` : ""}
                    {" · "}
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-600 text-sm font-semibold">Total Vendors</p>
          <p className="text-4xl font-bold text-blue-900 mt-2">
            {stats.total || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <p className="text-green-600 text-sm font-semibold">Active Vendors</p>
          <p className="text-4xl font-bold text-green-900 mt-2">
            {stats.active || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-600 text-sm font-semibold">Pending</p>
          <p className="text-4xl font-bold text-yellow-900 mt-2">
            {stats.pending || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 text-sm font-semibold">Suspended</p>
          <p className="text-4xl font-bold text-red-900 mt-2">
            {stats.suspended || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === "pending"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Pending Approvals ({pendingVendors.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === "active"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Active Vendors ({activeVendors.length})
        </button>
        <button
          onClick={() => setActiveTab("suspended")}
          className={`px-4 py-3 font-semibold transition ${
            activeTab === "suspended"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Suspended Vendors ({suspendedVendors.length})
        </button>
      </div>

      {/* Pending Vendors Section */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Pending Vendor Approvals
          </h2>

          {pendingVendors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-600 text-lg">
                No pending vendors! All vendors are approved.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        #{vendor.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleApproveVendor(vendor.id)}
                          disabled={processing[vendor.id]}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {processing[vendor.id] ? (
                            <>
                              <Loader
                                size={16}
                                className="mr-2 animate-spin"
                              />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Approve
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Vendors Section */}
      {activeTab === "active" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Active Vendors
          </h2>

          {activeVendors.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                No active vendors yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Approved At
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        #{vendor.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleSuspendVendor(vendor.id)}
                          disabled={processing[vendor.id]}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {processing[vendor.id] ? (
                            <>
                              <Loader
                                size={16}
                                className="mr-2 animate-spin"
                              />
                              Suspending...
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="mr-2" />
                              Suspend
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Suspended Vendors Section */}
      {activeTab === "suspended" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Suspended Vendors
          </h2>

          {suspendedVendors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-600 text-lg">
                No suspended vendors. All good!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Suspended At
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suspendedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        #{vendor.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleReactivateVendor(vendor.id)}
                          disabled={processing[vendor.id]}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {processing[vendor.id] ? (
                            <>
                              <Loader
                                size={16}
                                className="mr-2 animate-spin"
                              />
                              Reactivating...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Reactivate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
