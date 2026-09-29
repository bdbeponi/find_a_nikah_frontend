"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import {
  useGetVerificationsQuery,
  useReviewVerificationMutation,
} from "@/redux/features/moderationApi";
import { formatDate } from "@/utils/format";

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function AdminVerificationsPage() {
  const [filters, setFilters] = useState({ status: "pending", page: 1 });
  const { data, isLoading, isFetching } = useGetVerificationsQuery(filters);
  const [review, { isLoading: saving }] = useReviewVerificationMutation();

  // Keyed by request id: two rows being rejected would otherwise share one
  // reason box.
  const [reasons, setReasons] = useState({});

  const requests = data?.data?.verifications || [];
  const pagination = data?.data?.pagination;

  const act = async (id, status) => {
    const rejectionReason = reasons[id]?.trim();

    if (status === "rejected" && !rejectionReason) {
      toast.error("Give a reason so they know what to send instead");
      return;
    }

    try {
      const res = await review({ id, status, rejectionReason }).unwrap();
      toast.success(res.message || "Updated");
      setReasons((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      toast.error(err?.data?.message || "Could not update the request");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Verifications"
        subtitle={
          pagination ? `${pagination.totalCount} in this view` : "Loading…"
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
          className="input_field w-auto"
          aria-label="Status"
        >
          <option value="pending">Awaiting review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState
          title={
            filters.status === "pending" ? "Nothing waiting" : "No requests match"
          }
          message={
            filters.status === "pending"
              ? "No identity documents to check."
              : "Try another status."
          }
        />
      ) : (
        <div className={`space-y-4 ${isFetching ? "opacity-60" : ""}`}>
          {requests.map((request) => (
            <div key={request._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {request.userId?.fullName || "deleted account"}
                  </p>
                  <p className="mt-1 text-sm text-dark_gray">
                    {request.documentType?.replace(/_/g, " ")} · submitted{" "}
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONE[request.status]}>
                  {request.status}
                </StatusBadge>
              </div>

              {/*
                The document is an identity scan. It opens in a new tab rather
                than rendering inline: it is served from private storage, it
                may be a PDF, and it has no business sitting in a page that a
                moderator might screen-share.
              */}
              <a
                href={request.documentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline mt-3"
              >
                Open document
              </a>

              {request.status === "pending" && (
                <div className="mt-4 space-y-3 border-t border-gray_200 pt-4">
                  <div>
                    <label
                      className="label_field"
                      htmlFor={`reason-${request._id}`}
                    >
                      Reason (required to reject)
                    </label>
                    <input
                      id={`reason-${request._id}`}
                      value={reasons[request._id] || ""}
                      onChange={(e) =>
                        setReasons((prev) => ({
                          ...prev,
                          [request._id]: e.target.value,
                        }))
                      }
                      className="input_field"
                      placeholder="Blurry, expired, name does not match…"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => act(request._id, "approved")}
                      className="btn btn-gold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => act(request._id, "rejected")}
                      className="btn btn-outline"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {request.rejectionReason && (
                <p className="mt-3 text-sm text-dark_gray">
                  Rejected: {request.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </>
  );
}
