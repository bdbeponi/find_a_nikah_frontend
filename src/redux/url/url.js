// src/redux/url/url.js

// Base URL - "pro" points at production, anything else at the local backend
export const baseUriBackend =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "pro"
    ? process.env.NEXT_PUBLIC_API_PROD_URL
    : process.env.NEXT_PUBLIC_API_LOCAL_URL;

// API Base
export const API_BASE_URL = baseUriBackend + "api/v1/";

// The backend stores either a relative path ("public/upload/x.webp") when it
// writes to its own disk, or a full URL when it uploads to a bucket. An
// absolute one is already complete - prefixing it would produce nonsense like
// "https://backend…/https://bucket…".
export const imageUrl = (path) => {
  if (!path) return "/images/placeholder.png";
  return path.startsWith("http") ? path : `${baseUriBackend}${path}`;
};
