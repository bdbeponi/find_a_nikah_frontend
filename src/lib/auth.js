// The backend also sets HTTP-only cookies; this mirror exists so the client can
// tell whether to render logged-in UI and can send a Bearer header.
const KEY = "accessToken";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* private mode - cookies still carry the session */
  }
  window.dispatchEvent(new Event("authChanged"));
};

export const clearToken = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event("authChanged"));
};
