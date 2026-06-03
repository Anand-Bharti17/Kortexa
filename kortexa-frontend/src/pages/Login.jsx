import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import { BRAND_NAME } from "../config/brand";
import VelunoLogo from "../components/VelunoLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data.token;
      login(token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      let rawRole =
        payload.role || payload.roles || payload.authorities || "CUSTOMER";

      if (Array.isArray(rawRole) && rawRole.length > 0) {
        rawRole =
          typeof rawRole[0] === "object" ? rawRole[0].authority : rawRole[0];
      } else if (typeof rawRole === "object" && rawRole !== null) {
        rawRole = rawRole.authority || "CUSTOMER";
      }

      const role = String(rawRole).replace("ROLE_", "").toUpperCase();

      if (role === "VENDOR") navigate("/vendor");
      else if (role === "ADMIN") navigate("/admin");
      else navigate("/");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || "";

      if (errorMessage.includes("PENDING_APPROVAL")) {
        setError(
          "Your vendor application is under review. We'll notify you once approved.",
        );
      } else if (errorMessage.length > 0) {
        setError(errorMessage);
      } else {
        setError("Invalid email or password");
      }
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-2">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mb-8 text-center">
          <VelunoLogo size="lg" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your {BRAND_NAME} account
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full !py-3.5">
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
