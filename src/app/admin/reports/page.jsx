"use client";

import Link from "next/link";
import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { useGetReportsQuery } from "@/redux/features/moderationApi";
import { formatDate } from "@/utils/format";

const STATUS_TONE = {
  open: "danger",
  reviewing: "warning",
  resolved: "success",
  dismissed: "neutral",
};

export default function AdminReportsPage() {
  const [filters, setFilters] = useState({ status: "open", page: 1 });
  const { data, isLoading, isFetching } = useGetReportsQuery(filters);

  const reports = data?.data?.reports || [];
  const pagination = data?.data?.pagination;

  return (
    <>
      <AdminPageHeader
        title="Reports"
        subtitle={
          pagination ? `${pagination.totalCount} in this view` : "Loading…"
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ status: e.target.value, page: 1 })
          }
          className="input_field w-auto"
          aria-label="Status"
        >
          <option value="open">Open</option>
          <option value="reviewing">Being reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : reports.length === 0 ? (
        <EmptyState
          title={filters.status === "open" ? "Nothing open" : "No reports match"}
          message={
            filters.status === "open"
              ? "Nobody is waiting on you."
              : "Try another status."
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
                <th className="px-4 py-3 font-semibold">Reported</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">By</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Filed</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report._id}
                  className="border-b border-gray_200 last:border-0 hover:bg-cream"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reports/${report._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {report.reportedUserId?.fullName || "deleted account"}
                    </Link>
                    {report.reportedUserId?.accountStatus !== "active" && (
                      <StatusBadge tone="danger">
                        {report.reportedUserId?.accountStatus}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {report.reason?.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {report.reporterId?.fullName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[report.status]}>
                      {report.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(report.createdAt)}
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
