// src/redux/apiSlice/endpoints.js
//
// Route names, kept in step with find_a_nikah_backend/src/routes. This file is
// the only place a path string appears, so a backend rename is one edit here
// rather than a hunt through components.
//
// This app is the admin panel only - the member-facing product is a mobile
// app - so nothing here reaches the member endpoints beyond signing in.

export const auth = {
  login: "auth/login",
  logout: "auth/logout",
  refresh: "auth/refresh",
  me: "users/me",
  changePassword: "users/me/password",
};

export const admin = {
  dashboard: "admin/dashboard",
  users: "admin/users",
  profiles: "admin/profiles",
  reports: "admin/reports",
  verifications: "admin/verifications",
  photos: "admin/photos",
  plans: "admin/plans",
  payments: "admin/payments",
  subscriptions: "admin/subscriptions",
  announcements: "admin/notifications",
  auditLog: "admin/audit-log",
  staff: "admin/staff",
};

export const imageVerification = {
  imageVerification: "/face-verification"
}

export const endpoints = { auth, admin, imageVerification };
