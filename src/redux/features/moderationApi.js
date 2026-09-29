// src/redux/features/moderationApi.js
//
// The three queues a moderator works through, plus the audit trail. Kept apart
// from adminApi.js because these are the screens a moderator lives on, while
// that file is accounts and team administration.

import { apiSlice } from "@/redux/apiSlice/apiSlice";
import { endpoints } from "@/redux/apiSlice/endpoints";

// Empty values are dropped so the URL stays clean and two equivalent filter
// states share one cache entry instead of two.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );

export const moderationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    /* -------------------------------------------------------- profiles */
    getProfiles: builder.query({
      query: (params) => ({
        url: endpoints.admin.profiles,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Profile"],
    }),

    getProfile: builder.query({
      query: (id) => ({
        url: `${endpoints.admin.profiles}/${id}`,
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    setProfileStatus: builder.mutation({
      query: ({ id, status, rejectionReason }) => ({
        url: `${endpoints.admin.profiles}/${id}/status`,
        method: "PATCH",
        body: { status, rejectionReason },
      }),
      // Dashboard too: the queue counts on it just changed.
      invalidatesTags: ["Profile", "Dashboard"],
    }),

    /* --------------------------------------------------------- reports */
    getReports: builder.query({
      query: (params) => ({
        url: endpoints.admin.reports,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Report"],
    }),

    getReport: builder.query({
      query: (id) => ({
        url: `${endpoints.admin.reports}/${id}`,
        method: "GET",
      }),
      providesTags: ["Report"],
    }),

    resolveReport: builder.mutation({
      query: ({ id, status, resolutionNote, suspendUser }) => ({
        url: `${endpoints.admin.reports}/${id}`,
        method: "PATCH",
        body: { status, resolutionNote, suspendUser },
      }),
      // Member too: resolving can suspend the account it names.
      invalidatesTags: ["Report", "Dashboard", "Member"],
    }),

    /* --------------------------------------------------- verifications */
    getVerifications: builder.query({
      query: (params) => ({
        url: endpoints.admin.verifications,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Verification"],
    }),

    reviewVerification: builder.mutation({
      query: ({ id, status, rejectionReason }) => ({
        url: `${endpoints.admin.verifications}/${id}`,
        method: "PATCH",
        body: { status, rejectionReason },
      }),
      invalidatesTags: ["Verification", "Dashboard", "Member"],
    }),

    /* ------------------------------------------------------- audit log */
    getAuditLog: builder.query({
      query: (params) => ({
        url: endpoints.admin.auditLog,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Audit"],
    }),
  }),
});

export const {
  useGetProfilesQuery,
  useGetProfileQuery,
  useSetProfileStatusMutation,
  useGetReportsQuery,
  useGetReportQuery,
  useResolveReportMutation,
  useGetVerificationsQuery,
  useReviewVerificationMutation,
  useGetAuditLogQuery,
} = moderationApi;
