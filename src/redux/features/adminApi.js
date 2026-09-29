// src/redux/features/adminApi.js

import { apiSlice } from "@/redux/apiSlice/apiSlice";
import { endpoints } from "@/redux/apiSlice/endpoints";

export const adminApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => ({ url: endpoints.admin.dashboard, method: "GET" }),
      providesTags: ["Dashboard"],
    }),

    getAdminMembers: builder.query({
      // Empty values are dropped so the URL stays clean and two equivalent
      // filter states share one cache entry instead of two.
      query: (params = {}) => ({
        url: endpoints.admin.users,
        method: "GET",
        params: Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== ""
          )
        ),
      }),
      providesTags: ["Member"],
    }),

    getAdminMember: builder.query({
      query: (id) => ({ url: `${endpoints.admin.users}/${id}`, method: "GET" }),
      providesTags: ["Member"],
    }),

    setMemberStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `${endpoints.admin.users}/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: ["Member", "Dashboard"],
    }),

    setMemberVerification: builder.mutation({
      query: ({ id, isVerified }) => ({
        url: `${endpoints.admin.users}/${id}/verify`,
        method: "PATCH",
        body: { isVerified },
      }),
      invalidatesTags: ["Member", "Dashboard"],
    }),

    signOutMember: builder.mutation({
      query: ({ id, reason }) => ({
        url: `${endpoints.admin.users}/${id}/sign-out`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Member", "Audit"],
    }),

    getStaff: builder.query({
      query: () => ({ url: endpoints.admin.staff, method: "GET" }),
      providesTags: ["Staff"],
    }),

    createStaff: builder.mutation({
      query: (body) => ({
        url: endpoints.admin.staff,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),

    setStaffRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `${endpoints.admin.staff}/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Staff"],
    }),

    setStaffStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `${endpoints.admin.staff}/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminMembersQuery,
  useGetAdminMemberQuery,
  useSetMemberStatusMutation,
  useSetMemberVerificationMutation,
  useSignOutMemberMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useSetStaffRoleMutation,
  useSetStaffStatusMutation,
} = adminApi;
