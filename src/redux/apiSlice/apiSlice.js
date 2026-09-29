// src/redux/apiSlice/apiSlice.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/redux/url/url";
import { getToken } from "@/lib/auth";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    // Auth rides on the HTTP-only cookies the backend sets; the Bearer header is
    // a fallback for when those cookies are blocked (private mode, some mobile
    // browsers on a cross-port dev setup).
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      // When the API is reached through an ngrok tunnel, ngrok answers any
      // browser-looking request with its own HTML warning page instead of
      // passing it through - so every fetch would get markup where it expected
      // JSON. This header opts out. Every other host ignores it.
      headers.set("ngrok-skip-browser-warning", "true");
      return headers;
    },
  }),

  tagTypes: [
    "User",
    "Member",
    "Dashboard",
    "Staff",
    "Profile",
    "Report",
    "Verification",
    "Photo",
    "Plan",
    "Payment",
    "Subscription",
    "Audit",
  ],
  endpoints: () => ({}),
});
