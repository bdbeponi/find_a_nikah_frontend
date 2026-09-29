// src/redux/features/authApi.js

import { apiSlice } from "@/redux/apiSlice/apiSlice";
import { endpoints } from "@/redux/apiSlice/endpoints";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    loginApi: builder.mutation({
      query: (body) => ({
        url: endpoints.auth.login,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    logoutApi: builder.mutation({
      query: () => ({
        url: endpoints.auth.logout,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    getCurrentUser: builder.query({
      query: () => ({
        url: endpoints.auth.me,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    changePasswordApi: builder.mutation({
      query: (body) => ({
        url: endpoints.auth.changePassword,
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useLoginApiMutation,
  useLogoutApiMutation,
  useGetCurrentUserQuery,
  useChangePasswordApiMutation,
} = authApi;
