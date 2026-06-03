import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import api from "../services/api";
import { BRAND_NAME } from "../config/brand";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { email, password, role });
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-2">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg">
            <UserPlus size={28} />
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Join {BRAND_NAME} as a shopper or vendor
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Account type
            </label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="CUSTOMER">Customer — buy products</option>
              <option value="VENDOR">Vendor — sell products</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {role === "VENDOR"
                ? "Vendor accounts require admin approval before listing products."
                : "Start shopping right after you sign in."}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3.5"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
