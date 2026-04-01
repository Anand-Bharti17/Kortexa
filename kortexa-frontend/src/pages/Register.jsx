import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  // Removed the 'name' state completely!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER"); // NEW: Role selection
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // THE FIX: We now send exactly what your DTO asks for.
      // Note: Change "CUSTOMER" if your backend expects something else like "USER" or "ROLE_CUSTOMER"
      await api.post("/auth/register", {
        email: email,
        password: password,
        role: role, // UPDATED: Use selected role instead of hardcoded
      });

      // On success, send them to the login page
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="p-8 bg-white rounded-xl shadow-lg w-96 border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Create Account
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Join the high-speed Kortexa platform
        </p>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Removed the Full Name input field! */}

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
              minLength="6"
              required
            />
          </div>

          {/* NEW: Role Selection Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="CUSTOMER">Customer (Buy Products)</option>
              <option value="VENDOR">Vendor (Sell Products)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === "VENDOR"
                ? "✓ Your vendor account will need admin approval before you can list products"
                : "✓ Start shopping immediately after registration"}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-semibold py-3 rounded-lg transition shadow-md mt-4 ${loading ? "bg-gray-400" : "bg-gray-900 hover:bg-gray-800"}`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
