"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import {
  useGetPhotosQuery,
  useReviewPhotoMutation,
} from "@/redux/features/billingApi";
import { imageUrl } from "@/redux/url/url";
import { formatDate } from "@/utils/format";

export default function AdminPhotosPage() {
  const [filters, setFilters] = useState({ status: "pending", page: 1 });
  const { data, isLoading, isFetching } = useGetPhotosQuery(filters);
  const [review, { isLoading: saving }] = useReviewPhotoMutation();

  // Keyed by photo id: two rows being rejected would otherwise share one box.
  const [reasons, setReasons] = useState({});

  const photos = data?.data?.photos || [];
  const pagination = data?.data?.pagination;

  const act = async (id, isApproved) => {
    const rejectionReason = reasons[id]?.trim();

    if (!isApproved && !rejectionReason) {
      toast.error("Say why, so they know what to upload instead");
      return;
    }

    try {
      const res = await review({ id, isApproved, rejectionReason }).unwrap();
      toast.success(res.message || "Updated");
      setReasons((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      toast.error(err?.data?.message || "Could not update the photo");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Photos"
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
      ) : photos.length === 0 ? (
        <EmptyState
          title={filters.status === "pending" ? "Nothing waiting" : "No photos match"}
          message={
            filters.status === "pending"
              ? "No new photos to look at."
              : "Try another status."
          }
        />
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
            isFetching ? "opacity-60" : ""
          }`}
        >
          {photos.map((photo) => (
            <div key={photo._id} className="card overflow-hidden">
              {/*
                A plain <img>, not next/image. These are member uploads served
                from the backend's own disk on whatever host it happens to run
                on, and next/image refuses a host it was not configured with at
                build time - which would leave the moderator with a broken box
                instead of the photo they are meant to be judging.
              */}
              <a
                href={imageUrl(photo.url)}
                target="_blank"
                rel="noreferrer noopener"
                title="Open full size"
              >
                <img
                  src={imageUrl(photo.url)}
                  alt=""
                  className="h-56 w-full bg-cream object-cover"
                />
              </a>

              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${photo.userId?._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {photo.userId?.fullName || "deleted account"}
                    </Link>
                    <p className="mt-0.5 text-xs text-dark_gray">
                      {photo.isPrimary ? "Main photo · " : ""}
                      {formatDate(photo.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      photo.isApproved
                        ? "success"
                        : photo.rejectionReason
                          ? "danger"
                          : "warning"
                    }
                  >
                    {photo.isApproved
                      ? "approved"
                      : photo.rejectionReason
                        ? "rejected"
                        : "pending"}
                  </StatusBadge>
                </div>

                {/*
                  The same two controls whatever the current state. A photo that
                  was approved and then turns out to be somebody else's still has
                  to come down, and taking it down needs a reason exactly as
                  rejecting it would.
                */}
                <div className="mt-3 space-y-2 border-t border-gray_200 pt-3">
                  <input
                    value={reasons[photo._id] || ""}
                    onChange={(e) =>
                      setReasons((prev) => ({
                        ...prev,
                        [photo._id]: e.target.value,
                      }))
                    }
                    className="input_field"
                    placeholder="Reason (required to reject)"
                    aria-label="Rejection reason"
                  />
                  <div className="flex flex-wrap gap-2">
                    {!photo.isApproved && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => act(photo._id, true)}
                        className="btn btn-gold"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => act(photo._id, false)}
                      className="btn btn-outline"
                    >
                      {photo.isApproved ? "Take it down" : "Reject"}
                    </button>
                  </div>
                </div>

                {photo.rejectionReason && (
                  <p className="mt-2 text-sm text-dark_gray">
                    Rejected: {photo.rejectionReason}
                  </p>
                )}
              </div>
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
