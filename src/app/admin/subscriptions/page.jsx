"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import { useDebounced } from "@/hooks/useDebounced";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";
import { useGetAdminMembersQuery } from "@/redux/features/adminApi";
import {
  useGetPlansQuery,
  useGetSubscriptionsQuery,
  useGrantSubscriptionMutation,
  useUpdateSubscriptionMutation,
} from "@/redux/features/billingApi";
import { formatDate, formatMoney } from "@/utils/format";

const STATUS_TONE = {
  active: "success",
  pending: "warning",
  expired: "neutral",
  cancelled: "danger",
};

export default function AdminSubscriptionsPage() {
  const [filters, setFilters] = useState({ status: "active", page: 1 });
  const { data, isLoading, isFetching } = useGetSubscriptionsQuery(filters);
  const { data: meData } = useGetCurrentUserQuery();
  const { data: plansData } = useGetPlansQuery();
  const [grant, { isLoading: granting }] = useGrantSubscriptionMutation();
  const [update, { isLoading: updating }] = useUpdateSubscriptionMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [planId, setPlanId] = useState("");
  const [note, setNote] = useState("");

  const debouncedSearch = useDebounced(search);
  // Only asked for while the grant form is open and something has been typed,
  // so the member list is not fetched on every visit to this page.
  const { data: matches } = useGetAdminMembersQuery(
    { search: debouncedSearch, limit: 5 },
    { skip: !formOpen || debouncedSearch.length < 2 }
  );

  const canGrant = ["super_admin", "admin"].includes(meData?.data?.role);
  const subscriptions = data?.data?.subscriptions || [];
  const pagination = data?.data?.pagination;
  const plans = (plansData?.data || []).filter((plan) => plan.isActive);

  /**
   * Two different things somebody means by "cancel".
   *
   * Stopping the renewal leaves the days they paid for alone; ending it now
   * takes those days back, which is a refund decision. The confirm spells out
   * which one is about to happen rather than leaving it to the button label.
   */
  const change = async (subscription, endNow) => {
    const ok = window.confirm(
      endNow
        ? `End ${subscription.userId?.fullName}’s subscription now? They lose access today, before the days they paid for run out.`
        : `Stop ${subscription.userId?.fullName}’s subscription renewing? They keep access until ${new Date(subscription.endsAt).toDateString()}.`
    );
    if (!ok) return;

    const note = window.prompt("Why? (goes in the audit log)") || undefined;

    try {
      const res = await update({ id: subscription._id, endNow, note }).unwrap();
      toast.success(res.message || "Updated");
    } catch (err) {
      toast.error(err?.data?.message || "Could not change it");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!picked || !planId) {
      toast.error("Pick a member and a plan");
      return;
    }

    try {
      const res = await grant({ userId: picked._id, planId, note }).unwrap();
      toast.success(res.message || "Granted");
      setFormOpen(false);
      setPicked(null);
      setSearch("");
      setNote("");
    } catch (err) {
      toast.error(err?.data?.message || "Could not grant it");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Subscriptions"
        subtitle={
          pagination ? `${pagination.totalCount} in this view` : "Loading…"
        }
        action={
          canGrant && !formOpen ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="btn btn-gold"
            >
              Grant a subscription
            </button>
          ) : null
        }
      />

      {formOpen && (
        <form onSubmit={submit} className="card mb-6 space-y-4 p-5">
          <h2 className="font-semibold text-primary-dark">Grant a subscription</h2>
          {/* For the member who paid over bKash personal, or the one being made
              good after a support failure. It writes a zero-amount payment row
              so the revenue figures stay honest about what was actually taken. */}
          <p className="text-sm text-dark_gray">
            Recorded at zero, so it does not show up as revenue.
          </p>

          <div>
            <label className="label_field" htmlFor="member">
              Member
            </label>
            {picked ? (
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink">{picked.fullName}</span>
                <span className="text-sm text-dark_gray">{picked.phone}</span>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="btn btn-ghost px-2 text-sm"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  id="member"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input_field"
                  placeholder="Search by name or phone"
                />
                {(matches?.data?.members || []).length > 0 && (
                  <ul className="mt-2 divide-y divide-gray_200 rounded-lg border border-gray_200">
                    {matches.data.members.map((member) => (
                      <li key={member._id}>
                        <button
                          type="button"
                          onClick={() => setPicked(member)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-cream"
                        >
                          <span className="font-medium">{member.fullName}</span>
                          <span className="text-dark_gray">{member.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div>
            <label className="label_field" htmlFor="plan">
              Plan
            </label>
            <select
              id="plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="input_field"
            >
              <option value="">Choose a plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} · {formatMoney(plan.priceMinor, plan.currency)} ·{" "}
                  {plan.durationDays} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label_field" htmlFor="note">
              Why (goes in the audit log)
            </label>
            <input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input_field"
              placeholder="Paid over bKash personal, refund goodwill…"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={granting} className="btn btn-gold">
              {granting ? "Granting…" : "Grant"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <select
          value={filters.expiring ? "expiring" : filters.status}
          onChange={(e) =>
            setFilters(
              e.target.value === "expiring"
                ? { expiring: "true", page: 1 }
                : { status: e.target.value, page: 1 }
            )
          }
          className="input_field w-auto"
          aria-label="Status"
        >
          <option value="active">Active</option>
          <option value="expiring">Ending within a week</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          title="Nothing here"
          message="No subscriptions match this filter."
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
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ends</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr
                  key={subscription._id}
                  className="border-b border-gray_200 last:border-0 hover:bg-cream"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${subscription.userId?._id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {subscription.userId?.fullName || "deleted account"}
                    </Link>
                    <span className="block text-xs text-dark_gray">
                      {subscription.userId?.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {subscription.planId?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatMoney(subscription.pricePaidMinor, subscription.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[subscription.status]}>
                      {subscription.status}
                    </StatusBadge>
                    {subscription.cancelledAt && (
                      <span className="block text-xs text-dark_gray">
                        will not renew
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dark_gray">
                    {formatDate(subscription.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {canGrant && subscription.status === "active" && (
                      <span className="flex gap-1">
                        {!subscription.cancelledAt && (
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => change(subscription, false)}
                            className="btn btn-ghost text-sm"
                          >
                            Stop renewal
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => change(subscription, true)}
                          className="btn btn-ghost text-sm"
                        >
                          End now
                        </button>
                      </span>
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
