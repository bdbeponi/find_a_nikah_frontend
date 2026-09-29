"use client";

import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { useGetAuditLogQuery } from "@/redux/features/moderationApi";
import { formatDate } from "@/utils/format";

// A suspension is the entry somebody will come asking about, so it reads red.
const toneFor = (action) =>
  action?.includes("suspend") || action?.includes("reject")
    ? "danger"
    : "neutral";

export default function AdminAuditLogPage() {
  const [filters, setFilters] = useState({ action: "", page: 1 });
  const { data, isLoading, isFetching } = useGetAuditLogQuery(filters);

  const entries = data?.data?.entries || [];
  const pagination = data?.data?.pagination;

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        subtitle="Every staff action, newest first. Append-only."
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select
          value={filters.action}
          onChange={(e) => setFilters({ action: e.target.value, page: 1 })}
          className="input_field w-auto"
          aria-label="Action"
        >
          <option value="">All actions</option>
          <option value="profile.published">Profile published</option>
          <option value="profile.rejected">Profile rejected</option>
          <option value="profile.hidden">Profile hidden</option>
          <option value="report.resolved">Report resolved</option>
          <option value="report.dismissed">Report dismissed</option>
          <option value="user.suspend">Account suspended</option>
          <option value="verification.approved">Verification approved</option>
          <option value="verification.rejected">Verification rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          message="Staff actions show up here as they happen."
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
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">Did</th>
                <th className="px-4 py-3 font-semibold">To</th>
                <th className="px-4 py-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-b border-gray_200 last:border-0"
                >
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">
                      {entry.actorId?.fullName || "removed"}
                    </span>
                    <span className="ml-2 text-xs text-dark_gray">
                      {entry.actorRole?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={toneFor(entry.action)}>
                      {entry.action}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-dark_gray">
                    {entry.targetType}
                    {/* The id is the only handle on the target, so it is shown
                        in full rather than truncated to look tidy. */}
                    <span className="block font-mono">{entry.targetId}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-dark_gray">
                    {entry.note || "—"}
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
