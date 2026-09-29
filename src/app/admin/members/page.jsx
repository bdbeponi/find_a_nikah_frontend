"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { Search } from "@/components/icons";
import { useDebounced } from "@/hooks/useDebounced";
import {
  useGetAdminMembersQuery,
  useSetMemberVerificationMutation,
} from "@/redux/features/adminApi";
import { formatDate, isActive, statusLabel } from "@/utils/format";
import { toast } from "sonner";

function MembersTable() {
  const params = useSearchParams();
  // Deep links from the dashboard tiles arrive as ?verified=false / ?active=false
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    verified: params.get("verified") || "",
    active: params.get("active") || "",
    page: 1,
  });

  // The input stays instant; only the request waits for a pause in typing.
  const search = useDebounced(filters.search);
  const { data, isLoading, isFetching } = useGetAdminMembersQuery({
    ...filters,
    search,
  });
  const members = data?.data?.members || [];
  const pagination = data?.data?.pagination;

  // Any filter change resets to page 1: staying on page 4 of a narrower result
  // set shows an empty table and looks like a bug.
  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  // Verifying is the job this screen exists for, and opening every member just
  // to press one button is the slow way round. The mutation invalidates the
  // list, so a row filtered by ?verified=false leaves on its own.
  const [setVerification, { isLoading: verifying }] =
    useSetMemberVerificationMutation();

  const toggleVerified = async (member) => {
    try {
      const res = await setVerification({
        id: member._id,
        isVerified: !member.isVerified,
      }).unwrap();
      toast.success(res.message || "Updated");
    } catch (err) {
      toast.error(err?.data?.message || "Could not change verification");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Members"
        subtitle={
          pagination ? `${pagination.totalCount} total` : "Loading…"
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search members</span>
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-dark_gray"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Name or phone"
            className="input_field pl-10"
          />
        </label>

        <select
          value={filters.gender}
          onChange={(e) => setFilter("gender", e.target.value)}
          className="input_field w-auto"
          aria-label="Gender"
        >
          <option value="">All genders</option>
          <option value="male">Grooms</option>
          <option value="female">Brides</option>
        </select>

        <select
          value={filters.verified}
          onChange={(e) => setFilter("verified", e.target.value)}
          className="input_field w-auto"
          aria-label="Verification"
        >
          <option value="">Any verification</option>
          <option value="true">Verified</option>
          <option value="false">Awaiting</option>
        </select>

        <select
          value={filters.active}
          onChange={(e) => setFilter("active", e.target.value)}
          className="input_field w-auto"
          aria-label="Account status"
        >
          <option value="">Any status</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : members.length === 0 ? (
        <EmptyState
          title="No members match"
          message="Try widening the filters."
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
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Looking as</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member._id}
                  className="border-b border-gray_200 last:border-0 hover:bg-cream"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${member._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {member.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-dark_gray">{member.phone}</td>
                  <td className="px-4 py-3 capitalize text-dark_gray">
                    {member.gender === "male" ? "Groom" : "Bride"}
                  </td>
                  <td className="space-x-1 px-4 py-3">
                    <StatusBadge tone={member.isVerified ? "success" : "warning"}>
                      {member.isVerified ? "Verified" : "Awaiting"}
                    </StatusBadge>
                    {!isActive(member) && (
                      <StatusBadge tone="danger">{statusLabel(member)}</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => toggleVerified(member)}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {member.isVerified ? "Un-verify" : "Verify"}
                    </button>
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

// useSearchParams needs a Suspense boundary, or the whole route opts out of
// static rendering and the build warns.
export default function AdminMembersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-dark_gray">Loading…</p>}>
      <MembersTable />
    </Suspense>
  );
}
