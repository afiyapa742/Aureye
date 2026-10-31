
import axios from "axios";

const API = axios.create({
 baseURL: import.meta.env.VITE_API_BASE_URL ,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// ADD TOKEN TO REQUEST
// ==========================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// HANDLE AUTHENTICATION / BLOCKED USER
// ==========================================

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (
      status === 403 &&
      message === "Your account has been blocked by the admin"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    // Handle an expired or invalid JWT.
    // Do not redirect for every 401, because some endpoints
    // may return 401 for other reasons.
    if (
      status === 401 &&
      /tokenexpired|jwt expired|invalid token|unauthorized/i.test(
        `${message || ""} ${error.response?.data?.error || ""}`
      )
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;
