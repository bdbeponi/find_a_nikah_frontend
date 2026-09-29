// src/redux/features/billingApi.js
//
// The photo queue and the money screens. Separate from moderationApi.js because
// the three queues there are a moderator's daily work, while plans and payments
// are an owner's - and the backend draws the same line: a moderator may read
// these, only an admin may write them.

import { apiSlice } from "@/redux/apiSlice/apiSlice";
import { endpoints } from "@/redux/apiSlice/endpoints";

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );

export const billingApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    /* ---------------------------------------------------------- photos */
    getPhotos: builder.query({
      query: (params) => ({
        url: endpoints.admin.photos,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Photo"],
    }),

    reviewPhoto: builder.mutation({
      query: ({ id, isApproved, rejectionReason }) => ({
        url: `${endpoints.admin.photos}/${id}`,
        method: "PATCH",
        body: { isApproved, rejectionReason },
      }),
      // Dashboard too: the queue count on it just changed.
      invalidatesTags: ["Photo", "Dashboard"],
    }),

    /* ----------------------------------------------------------- plans */
    getPlans: builder.query({
      query: () => ({ url: endpoints.admin.plans, method: "GET" }),
      providesTags: ["Plan"],
    }),

    createPlan: builder.mutation({
      query: (body) => ({
        url: endpoints.admin.plans,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plan"],
    }),

    updatePlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${endpoints.admin.plans}/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Plan"],
    }),

    retirePlan: builder.mutation({
      query: (id) => ({
        url: `${endpoints.admin.plans}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Plan"],
    }),

    /* -------------------------------------------------------- payments */
    getPayments: builder.query({
      query: (params) => ({
        url: endpoints.admin.payments,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Payment"],
    }),

    refundPayment: builder.mutation({
      query: ({ id, reason }) => ({
        url: `${endpoints.admin.payments}/${id}/refund`,
        method: "PATCH",
        body: { reason },
      }),
      // A refund ends the subscription it bought, so both lists are stale.
      invalidatesTags: ["Payment", "Subscription", "Dashboard"],
    }),

    /* --------------------------------------------------- subscriptions */
    getSubscriptions: builder.query({
      query: (params) => ({
        url: endpoints.admin.subscriptions,
        method: "GET",
        params: clean(params),
      }),
      providesTags: ["Subscription"],
    }),

    updateSubscription: builder.mutation({
      query: ({ id, endNow, note }) => ({
        url: `${endpoints.admin.subscriptions}/${id}`,
        method: "PATCH",
        body: { endNow, note },
      }),
      invalidatesTags: ["Subscription", "Member"],
    }),

    broadcast: builder.mutation({
      query: (body) => ({
        url: endpoints.admin.announcements,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Audit"],
    }),

    grantSubscription: builder.mutation({
      query: (body) => ({
        url: endpoints.admin.subscriptions,
        method: "POST",
        body,
      }),
      // A grant writes a Payment row too, so the money screens are both stale.
      invalidatesTags: ["Subscription", "Payment", "Plan", "Dashboard"],
    }),
  }),
});

export const {
  useGetPhotosQuery,
  useReviewPhotoMutation,
  useGetPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useRetirePlanMutation,
  useGetPaymentsQuery,
  useRefundPaymentMutation,
  useGetSubscriptionsQuery,
  useUpdateSubscriptionMutation,
  useGrantSubscriptionMutation,
  useBroadcastMutation,
} = billingApi;
