"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { ArrowBack } from "@/components/icons";
import {
  useGetAdminMemberQuery,
  useSetMemberStatusMutation,
  useSetMemberVerificationMutation,
  useSignOutMemberMutation,
} from "@/redux/features/adminApi";
import { useGetAuditLogQuery } from "@/redux/features/moderationApi";
import {
  ageFrom,
  formatDate,
  formatMoney,
  isActive,
  statusLabel,
} from "@/utils/format";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-gray_200 py-3 last:border-0">
    <dt className="text-sm text-dark_gray">{label}</dt>
    <dd className="max-w-[60%] text-right text-sm font-medium text-ink">
      {children ?? "—"}
    </dd>
  </div>
);

export default function AdminMemberPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useGetAdminMemberQuery(id);
  const [setVerification, { isLoading: verifying }] =
    useSetMemberVerificationMutation();
  const [setStatus, { isLoading: updatingStatus }] = useSetMemberStatusMutation();
  const [signOut, { isLoading: signingOut }] = useSignOutMemberMutation();

  // Everything staff have ever done to this account, newest first.
  const { data: history } = useGetAuditLogQuery(
    { targetType: "User", targetId: id, limit: 10 },
    { skip: !id }
  );

  const member = data?.data?.member;
  const profile = data?.data?.profile;
  const subscription = data?.data?.subscription;
  const stats = data?.data?.stats || {};
  const entries = history?.data?.entries || [];

  // One handler for all three mutations: they differ only in which one to call
  // and what to say afterwards, and RTK Query invalidates the cache itself.
  const run = async (mutate, body, failure) => {
    try {
      const res = await mutate({ id, ...body }).unwrap();
      toast.success(res.message || "Updated");
    } catch (err) {
      toast.error(err?.data?.message || failure);
    }
  };

  const endSessions = async () => {
    const ok = window.confirm(
      `Sign ${member.fullName} out of all ${stats.sessions} device${
        stats.sessions === 1 ? "" : "s"
      }? Their account stays open and they can sign back in.`
    );
    if (!ok) return;
    run(signOut, {}, "Could not sign them out");
  };

  if (isLoading) return <p className="text-sm text-dark_gray">Loading…</p>;

  if (isError || !member) {
    return (
      <>
        <p className="text-sm text-danger">Member not found.</p>
        <Link href="/admin/members" className="btn btn-outline mt-4">
          <ArrowBack size={18} /> Back to members
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/admin/members"
        className="mb-4 inline-flex items-center gap-1 text-sm text-dark_gray hover:text-primary"
      >
        <ArrowBack size={18} /> Members
      </Link>

      <AdminPageHeader
        title={member.fullName}
        subtitle={member.phone}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={verifying}
              onClick={() =>
                run(
                  setVerification,
                  { isVerified: !member.isVerified },
                  "Could not change verification"
                )
              }
              className={member.isVerified ? "btn btn-outline" : "btn btn-gold"}
            >
              {member.isVerified ? "Remove verification" : "Verify member"}
            </button>

            <button
              type="button"
              disabled={updatingStatus}
              onClick={() =>
                run(
                  setStatus,
                  { is_active: !isActive(member) },
                  "Could not change the account status"
                )
              }
              className="btn btn-ghost"
            >
              {isActive(member) ? "Suspend account" : "Reinstate account"}
            </button>

            {/* The support answer to "somebody else is in my account" - far
                milder than a suspension, and the count says whether it is even
                worth doing. */}
            {stats.sessions > 0 && (
              <button
                type="button"
                disabled={signingOut}
                onClick={endSessions}
                className="btn btn-ghost"
              >
                Sign out ({stats.sessions})
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">Account</h2>
          <dl>
            <Row label="Status">
              <span className="space-x-1">
                <StatusBadge tone={member.isVerified ? "success" : "warning"}>
                  {member.isVerified ? "Verified" : "Awaiting verification"}
                </StatusBadge>
                <StatusBadge tone={isActive(member) ? "success" : "danger"}>
                  {statusLabel(member)}
                </StatusBadge>
              </span>
            </Row>
            <Row label="Looking as">
              {member.gender === "male" ? "Groom" : "Bride"}
            </Row>
            <Row label="Email">{member.email}</Row>
            <Row label="Phone confirmed">
              {member.isPhoneVerified ? "Yes" : "No"}
            </Row>
            <Row label="Joined">{formatDate(member.createdAt)}</Row>
            <Row label="Last active">{formatDate(member.lastActiveAt)}</Row>
            <Row label="Verified on">
              {member.verifiedAt ? formatDate(member.verifiedAt) : null}
            </Row>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">Profile</h2>
          {profile ? (
            <dl>
              <Row label="Moderation">
                <Link
                  href={`/admin/profiles/${profile._id}`}
                  className="hover:underline"
                >
                  <StatusBadge
                    tone={
                      profile.profileStatus === "published" ? "success" : "warning"
                    }
                  >
                    {profile.profileStatus}
                  </StatusBadge>
                </Link>
              </Row>
              <Row label="Discoverable">
                {profile.isDiscoverable ? "Yes" : "Paused by member"}
              </Row>
              <Row label="Age">{ageFrom(profile.dateOfBirth)}</Row>
              <Row label="City">{profile.city}</Row>
              <Row label="Completeness">{profile.completeness}%</Row>
              <Row label="Photos">{stats.photoCount}</Row>
            </dl>
          ) : (
            <p className="text-sm text-dark_gray">
              They have not filled in a profile yet.
            </p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">Subscription</h2>
          {subscription ? (
            <dl>
              <Row label="Plan">{subscription.planId?.name}</Row>
              <Row label="Status">
                <StatusBadge
                  tone={subscription.status === "active" ? "success" : "neutral"}
                >
                  {subscription.status}
                </StatusBadge>
              </Row>
              <Row label="Paid">
                {formatMoney(subscription.pricePaidMinor, subscription.currency)}
              </Row>
              <Row label="Ends">{formatDate(subscription.endsAt)}</Row>
            </dl>
          ) : (
            <p className="text-sm text-dark_gray">On the free plan.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">Signals</h2>
          <dl>
            {/* One complaint is a disagreement, six is a pattern. */}
            <Row label="Reports against them">
              {stats.reportsAgainst > 0 ? (
                <StatusBadge
                  tone={stats.reportsAgainst >= 3 ? "danger" : "warning"}
                >
                  {stats.reportsAgainst}
                </StatusBadge>
              ) : (
                "none"
              )}
            </Row>
            {/* The number that answers "why can nobody see me" */}
            <Row label="Blocked by">
              {stats.blockedBy > 0 ? (
                <StatusBadge tone={stats.blockedBy >= 5 ? "danger" : "warning"}>
                  {stats.blockedBy}
                </StatusBadge>
              ) : (
                "nobody"
              )}
            </Row>
            <Row label="Signed-in devices">{stats.sessions}</Row>
          </dl>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="card mt-4 p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">
            What staff have done to this account
          </h2>
          <ul className="divide-y divide-gray_200">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span>
                  <StatusBadge
                    tone={
                      entry.action?.includes("suspend") ||
                      entry.action?.includes("reject")
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {entry.action}
                  </StatusBadge>
                  {entry.note && (
                    <span className="ml-2 text-dark_gray">{entry.note}</span>
                  )}
                </span>
                <span className="text-dark_gray">
                  {entry.actorId?.fullName || "removed"} ·{" "}
                  {formatDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
