import axios from "axios";

export const api = axios.create({
  // Em desenvolvimento, usa o proxy do Next.js para evitar CORS
  // Em produção, usa a variável de ambiente
  baseURL:
    process.env.NODE_ENV === "development"
      ? "/api"
      : process.env.NEXT_PUBLIC_API_URL ||
        "https://apismartcompras.francautolabs.com.br/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // garante envio do cookie httpOnly
});

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    // Força withCredentials para garantir envio de cookies
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
