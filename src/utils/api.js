import axios from "axios";

const API_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Редирект только если мы не на странице авторизации
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (
        window.location.pathname !== "/auth" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export const fetcher = (url) => api.get(url).then((res) => res.data);
