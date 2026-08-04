import axios from "axios";
import { siteConfig } from "@/config/site";

const api = axios.create({
  baseURL: siteConfig.apiUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    // Let the browser set multipart boundary — a hardcoded Content-Type breaks multer
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
