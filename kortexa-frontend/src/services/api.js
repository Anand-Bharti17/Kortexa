import axios from "axios";

// Create a base instance pointing to your Spring Boot server
const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

// The Interceptor: Runs before every request leaves the browser
api.interceptors.request.use(
  (config) => {
    // Look for the token in Local Storage
    const token = localStorage.getItem("kortexa_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
