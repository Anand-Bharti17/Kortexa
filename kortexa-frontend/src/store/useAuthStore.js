import { create } from "zustand";

// Helper function to crack open the JWT and read the payload
const getRoleFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    let rawRole = payload.role || payload.roles || payload.authorities || "CUSTOMER";

    // Handle array if authorities/roles is a list
    if (Array.isArray(rawRole) && rawRole.length > 0) {
      rawRole = rawRole[0];
    }

    // Handle object if it's [{authority: 'ROLE_VENDOR'}]
    if (typeof rawRole === "object" && rawRole !== null && rawRole.authority) {
      rawRole = rawRole.authority;
    }

    if (typeof rawRole !== "string") return "CUSTOMER";

    // Strip ROLE_ prefix if present (Spring Security default)
    return rawRole.replace("ROLE_", "").toUpperCase();
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
};

const initialToken = localStorage.getItem("kortexa_token");

const useAuthStore = create((set) => ({
  token: initialToken,
  isAuthenticated: !!initialToken,
  userRole: getRoleFromToken(initialToken), // <-- Now we know their role!

  login: (newToken) => {
    localStorage.setItem("kortexa_token", newToken);
    set({
      token: newToken,
      isAuthenticated: true,
      userRole: getRoleFromToken(newToken), // Decode on login
    });
  },

  logout: () => {
    localStorage.removeItem("kortexa_token");
    set({ token: null, isAuthenticated: false, userRole: null });
  },
}));

export default useAuthStore;
