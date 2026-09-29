"use client";

import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  Block,
  Flag,
  Group,
  Money,
  Pending,
  Photo,
  Profiles,
  Verified,
} from "@/components/icons";
import {
  useGetAdminDashboardQuery,
  useGetAdminMembersQuery,
} from "@/redux/features/adminApi";
import { formatDate, formatMoney, formatNumber } from "@/utils/format";

const Tile = ({ label, value, Icon, href, urgent }) => {
  const body = (
    <div
      className={`card flex items-center gap-4 p-5 transition hover:border-primary/40 ${
        // A queue with something in it should not look the same as an empty one
        urgent && value > 0 ? "border-gold bg-gold/5" : ""
      }`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-primary">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-primary-dark">
          {formatNumber(value)}
        </p>
        <p className="truncate text-sm text-dark_gray">{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
};

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  // The queue a moderator actually opens this page to work through, rather
  // than another number to read and then go looking for.
  const { data: pending } = useGetAdminMembersQuery({
    verified: "false",
    limit: 5,
  });

  const stats = data?.data;
  const queues = stats?.queues || {};
  const waiting = pending?.data?.members || [];

  if (isLoading) {
    return <p className="text-sm text-dark_gray">Loading…</p>;
  }

  if (isError || !stats) {
    return (
      <p className="text-sm text-danger">
        Could not load the dashboard. Is the backend running?
      </p>
    );
  }

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="What is waiting, and who is here." />

      <h2 className="mb-3 text-sm font-semibold text-dark_gray uppercase">
        Queues
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Profiles to review"
          value={queues.pendingProfiles}
          Icon={Profiles}
          href="/admin/profiles"
          urgent
        />
        <Tile
          label="Open reports"
          value={queues.openReports}
          Icon={Flag}
          href="/admin/reports"
          urgent
        />
        <Tile
          label="Verification requests"
          value={queues.pendingVerifications}
          Icon={Verified}
          href="/admin/verifications"
          urgent
        />
        <Tile
          label="Photos to review"
          value={queues.pendingPhotos}
          Icon={Photo}
          href="/admin/photos"
          urgent
        />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-dark_gray uppercase">
        Money
      </h2>
      {/* A currency, not a count, so it does not go through the Tile above -
          formatNumber on poisha would read "99,900" for a 999 taka plan. */}
      <Link href="/admin/payments" className="card flex items-center gap-4 p-5 transition hover:border-primary/40">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-primary">
          <Money size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-primary-dark">
            {formatMoney(stats.revenueMinor)}
          </p>
          <p className="truncate text-sm text-dark_gray">Taken, all time</p>
        </div>
      </Link>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-dark_gray uppercase">
        Members
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Total members"
          value={stats.total}
          Icon={Group}
          href="/admin/members"
        />
        <Tile label="Identity verified" value={stats.verified} Icon={Verified} />
        <Tile
          label="Not yet verified"
          value={stats.unverifiedMembers}
          Icon={Pending}
          href="/admin/members?verified=false"
        />
        <Tile
          label="Suspended or closed"
          value={stats.disabled}
          Icon={Block}
          href="/admin/members?active=false"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Tile label="Grooms" value={stats.male} Icon={Group} />
        <Tile label="Brides" value={stats.female} Icon={Group} />
        <Tile label="Joined this week" value={stats.newThisWeek} Icon={Group} />
      </div>

      {waiting.length > 0 && (
        <section className="card mt-6 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-primary-dark">
              Newest unverified members
            </h2>
            <Link
              href="/admin/members?verified=false"
              className="text-sm font-semibold text-primary hover:underline"
            >
              See all
            </Link>
          </div>

          <ul className="divide-y divide-gray_200">
            {waiting.map((member) => (
              <li key={member._id}>
                <Link
                  href={`/admin/members/${member._id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-primary"
                >
                  <span className="font-medium">
                    {member.fullName}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-dark_gray">
                    <StatusBadge>
                      {member.gender === "male" ? "Groom" : "Bride"}
                    </StatusBadge>
                    {formatDate(member.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
