// Base URL - "pro" points at production, anything else at the local backend
const rawBackend =
  (process.env.NEXT_PUBLIC_ENVIRONMENT === "pro"
    ? process.env.NEXT_PUBLIC_API_PROD_URL
    : process.env.NEXT_PUBLIC_API_LOCAL_URL) || "http://localhost:5000/";

export const baseUriBackend = rawBackend.endsWith("/")
  ? rawBackend
  : `${rawBackend}/`;

// API Base
export const API_BASE_URL = `${baseUriBackend}api/v1/`;

// Image helper for disk uploads vs bucket uploads
export const imageUrl = (path) => {
  if (!path) return "/images/placeholder.png";
  return path.startsWith("http") ? path : `${baseUriBackend}${path}`;
};

