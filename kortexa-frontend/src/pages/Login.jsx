import { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

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
      let rawRole = payload.role || payload.roles || payload.authorities || "CUSTOMER";

      // Consistently extract and clean prefix
      if (Array.isArray(rawRole) && rawRole.length > 0) {
        rawRole = typeof rawRole[0] === 'object' ? rawRole[0].authority : rawRole[0];
      } else if (typeof rawRole === 'object' && rawRole !== null) {
        rawRole = rawRole.authority || "CUSTOMER";
      }

      const role = String(rawRole).replace("ROLE_", "").toUpperCase();

      if (role === "VENDOR") {
        navigate("/vendor");
      } else if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      // 🕵️ PRINT THE EXACT ERROR TO THE CONSOLE
      console.log("RAW ERROR FROM BACKEND:", err);
      console.log("ERROR RESPONSE DATA:", err.response?.data);

      // Check both 'message' and 'error' fields for flexibility
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        "";

      // First check for PENDING_APPROVAL (most specific case)
      if (errorMessage.includes("PENDING_APPROVAL")) {
        setError(
          "Your vendor application is currently under review by an Admin. We will notify you once approved!",
        );
      } else if (errorMessage.length > 0) {
        // Use backend message if available
        setError(errorMessage);
      } else {
        // Default fallback
        setError("Invalid email or password");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="p-8 bg-white rounded-xl shadow-lg w-96 border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Sign In
        </h2>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition shadow-md mt-4"
          >
            Secure Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline font-semibold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
