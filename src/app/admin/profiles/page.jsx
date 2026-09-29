"use client";

import Link from "next/link";
import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { Search } from "@/components/icons";
import { useDebounced } from "@/hooks/useDebounced";
import { useGetProfilesQuery } from "@/redux/features/moderationApi";
import { ageFrom, formatDate } from "@/utils/format";

// Mirrors PROFILE_STATUSES in the backend's constants.js.
const STATUS_TONE = {
  pending: "warning",
  published: "success",
  rejected: "danger",
  hidden: "neutral",
};

export default function AdminProfilesPage() {
  // Opens on the queue, not on everything: the reason to visit this screen is
  // the profiles nobody has looked at yet.
  const [filters, setFilters] = useState({
    status: "pending",
    search: "",
    page: 1,
  });

  const search = useDebounced(filters.search);
  const { data, isLoading, isFetching } = useGetProfilesQuery({
    ...filters,
    search,
  });

  const profiles = data?.data?.profiles || [];
  const pagination = data?.data?.pagination;

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <>
      <AdminPageHeader
        title="Profiles"
        subtitle={
          pagination ? `${pagination.totalCount} in this view` : "Loading…"
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search by name</span>
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-dark_gray"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Name"
            className="input_field pl-10"
          />
        </label>

        <select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="input_field w-auto"
          aria-label="Status"
        >
          <option value="pending">Awaiting review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="hidden">Hidden</option>
          <option value="">All statuses</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : profiles.length === 0 ? (
        <EmptyState
          title={
            filters.status === "pending"
              ? "Nothing waiting"
              : "No profiles match"
          }
          message={
            filters.status === "pending"
              ? "The review queue is empty."
              : "Try widening the filters."
          }
        />
      ) : (
        <div
          className={`card overflow-x-auto transition-opacity ${
            isFetching ? "opacity-60" : ""
          }`}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray_200 text-xs text-dark_gray uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Age</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile._id}
                  className="border-b border-gray_200 last:border-0 hover:bg-cream"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/profiles/${profile._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {profile.userId?.fullName}
                    </Link>
                    <span className="ml-2 text-xs text-dark_gray">
                      {profile.gender === "male" ? "Groom" : "Bride"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {ageFrom(profile.dateOfBirth) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {profile.city || "—"}
                  </td>
                  <td className="space-x-1 px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[profile.profileStatus]}>
                      {profile.profileStatus}
                    </StatusBadge>
                    {!profile.isDiscoverable && (
                      <StatusBadge>paused by member</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(profile.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </>
  );
}
