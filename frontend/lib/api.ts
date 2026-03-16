import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 0,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post("/api/auth/register", { name, email, password }),
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
};

export const chatApi = {
  query:     (question: string, csv_name?: string) =>
    api.post("/api/chat/query", { question, csv_name }),
  csvQuery:  (question: string, csv_name: string) =>
    api.post("/api/chat/csv-query", { question, csv_name }),
  suggestions: () => api.get("/api/chat/suggestions"),
};

export const historyApi = {
  list:   ()           => api.get("/api/history/"),
  get:    (id: number) => api.get(`/api/history/${id}`),
  delete: (id: number) => api.delete(`/api/history/${id}`),
};

export const uploadApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/api/upload/csv", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 0,
      onUploadProgress: (e) => {
        if (e.total) {
          const pct = Math.round((e.loaded * 100) / e.total);
          console.log(`Upload: ${pct}%`);
        }
      },
    });
  },
  list:   ()               => api.get("/api/upload/list"),
  delete: (name: string)   => api.delete(`/api/upload/csv/${name}`),
  meta:   (name: string)   => api.get(`/api/upload/meta/${name}`),  // ✅ new
};

export const exportDownload = async (type: "csv" | "pdf", id: number) => {
  const token = localStorage.getItem("token");
  const url = `${API_URL}/api/export/${type}/${id}?token=${encodeURIComponent(token || "")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Export failed ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nykaa_bi_${id}.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};