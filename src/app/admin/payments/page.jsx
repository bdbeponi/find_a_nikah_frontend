"use client";

import Link from "next/link";
import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { toast } from "sonner";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";
import {
  useGetPaymentsQuery,
  useRefundPaymentMutation,
} from "@/redux/features/billingApi";
import { formatDate, formatMoney, formatNumber } from "@/utils/format";

const STATUS_TONE = {
  succeeded: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState({ status: "succeeded", page: 1 });
  const { data, isLoading, isFetching } = useGetPaymentsQuery(filters);
  const { data: meData } = useGetCurrentUserQuery();
  const [refund, { isLoading: refunding }] = useRefundPaymentMutation();

  // A moderator reads this screen for support questions; only an admin moves
  // money. The backend refuses their call either way.
  const canRefund = ["super_admin", "admin"].includes(meData?.data?.role);

  const onRefund = async (payment) => {
    // Spelled out because nothing here moves money — the gateway does, and
    // somebody recording a refund that was never actually paid out leaves a
    // member with no subscription and no money back.
    const reason = window.prompt(
      [
        `Record a refund of ${formatMoney(
          payment.amountMinor,
          payment.currency
        )} for ${payment.userId?.fullName}?`,
        "",
        "This does NOT move money — refund it at the gateway first.",
        "It ends the subscription this payment bought.",
        "",
        "Why:",
      ].join("\n")
    );
    if (reason === null) return;

    try {
      const res = await refund({ id: payment._id, reason }).unwrap();
      toast.success(res.message || "Refunded");
    } catch (err) {
      toast.error(err?.data?.message || "Could not record the refund");
    }
  };

  const payments = data?.data?.payments || [];
  const revenue = data?.data?.revenue;
  const pagination = data?.data?.pagination;

  return (
    <>
      <AdminPageHeader
        title="Payments"
        subtitle={
          pagination ? `${pagination.totalCount} in this view` : "Loading…"
        }
      />

      {/* Totalled over the filter, not over the page - "this page adds up to
          12,000" is a number nobody wants. */}
      {revenue && (
        <div className="card mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 p-5">
          <div>
            <p className="text-2xl font-bold text-primary-dark">
              {formatMoney(revenue.amountMinor)}
            </p>
            <p className="text-sm text-dark_gray">
              taken across {formatNumber(revenue.count)} successful payment
              {revenue.count === 1 ? "" : "s"} matching this filter
            </p>
          </div>
        </div>
      )}

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
          className="input_field w-auto"
          aria-label="Status"
        >
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : payments.length === 0 ? (
        <EmptyState title="No payments" message="Nothing matches this filter." />
      ) : (
        <div
          className={`card overflow-x-auto transition-opacity ${
            isFetching ? "opacity-60" : ""
          }`}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray_200 text-xs text-dark_gray uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Gateway</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment._id}
                  className="border-b border-gray_200 last:border-0 hover:bg-cream"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${payment.userId?._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {payment.userId?.fullName || "deleted account"}
                    </Link>
                    <span className="block text-xs text-dark_gray">
                      {payment.userId?.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {payment.planId?.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(payment.amountMinor, payment.currency)}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {payment.gateway?.replace(/_/g, " ")}
                    {/* The gateway's own reference is what a dispute is looked
                        up by, so it is shown in full rather than truncated. */}
                    {payment.gatewayRef && (
                      <span className="block font-mono text-xs">
                        {payment.gatewayRef}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[payment.status]}>
                      {payment.status}
                    </StatusBadge>
                    {/* Money taken with nothing bought. The member's own
                        subscription screen repairs this on their next visit;
                        seeing it here is how support finds out first. */}
                    {payment.status === "succeeded" && !payment.subscriptionId && (
                      <StatusBadge tone="danger">not applied</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {canRefund && payment.status === "succeeded" && (
                      <button
                        type="button"
                        disabled={refunding}
                        onClick={() => onRefund(payment)}
                        className="btn btn-ghost text-sm"
                      >
                        Refund
                      </button>
                    )}
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
