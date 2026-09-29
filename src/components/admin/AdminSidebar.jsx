"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Close,
  Campaign,
  Dashboard,
  Flag,
  Group,
  History,
  Logout,
  Money,
  Menu,
  Photo,
  Plan,
  Profiles,
  User,
  Verified,
} from "@/components/icons";
import { info } from "@/config/info";
import { clearToken } from "@/lib/auth";
import {
  useGetCurrentUserQuery,
  useLogoutApiMutation,
} from "@/redux/features/authApi";
import { useGetAdminDashboardQuery } from "@/redux/features/adminApi";

// `superOnly` hides the link; the backend refuses the calls behind it anyway,
// so this only stops a moderator walking into a screen of failures.
// `queue` names the counter in the dashboard payload that badges the link.
const links = [
  { label: "Dashboard", href: "/admin", Icon: Dashboard },
  { label: "Profiles", href: "/admin/profiles", Icon: Profiles, queue: "pendingProfiles" },
  { label: "Reports", href: "/admin/reports", Icon: Flag, queue: "openReports" },
  {
    label: "Verifications",
    href: "/admin/verifications",
    Icon: Verified,
    queue: "pendingVerifications",
  },
  { label: "Photos", href: "/admin/photos", Icon: Photo, queue: "pendingPhotos" },
  { label: "Members", href: "/admin/members", Icon: Group },
  { label: "Subscriptions", href: "/admin/subscriptions", Icon: Money },
  { label: "Payments", href: "/admin/payments", Icon: Money },
  { label: "Plans", href: "/admin/plans", Icon: Plan },
  {
    label: "Announcements",
    href: "/admin/announcements",
    Icon: Campaign,
  },
  { label: "Audit log", href: "/admin/audit-log", Icon: History, superOnly: true },
  { label: "Team", href: "/admin/staff", Icon: User, superOnly: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logout] = useLogoutApiMutation();
  const [open, setOpen] = useState(false);
  // Both already in the cache - AdminGuard fetches the user, the dashboard
  // page fetches the counts - so neither costs an extra request here.
  const { data: meData } = useGetCurrentUserQuery();
  const { data: dashData } = useGetAdminDashboardQuery();
  const isSuperAdmin = meData?.data?.role === "super_admin";
  const queues = dashData?.data?.queues || {};

  const onLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Cookie may already be gone; sending them to /login is right either way.
    }
    clearToken();
    toast.success("Logged out");
    router.push("/login");
  };

  const nav = (
    <nav className="space-y-1">
      {links.map(({ label, href, Icon, superOnly, queue }) => {
        if (superOnly && !isSuperAdmin) return null;

        // `/admin` would otherwise light up on every child route, so the root
        // link matches exactly and the rest match their subtree.
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);

        const waiting = queue ? queues[queue] : 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-primary text-white"
                : "text-ink hover:bg-cream"
            }`}
          >
            <Icon size={20} />
            {label}
            {waiting > 0 && (
              // Announced as part of the link, so a screen reader says
              // "Reports, 3 waiting" rather than reading a bare number.
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-gold/20 text-gold-dark"
                }`}
              >
                {waiting}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Phone: a bar with a toggle, since there is no room for a rail */}
      <div className="flex items-center justify-between border-b border-gray_200 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-primary-dark">{info.appName}</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="btn btn-ghost px-2"
        >
          {open ? <Close size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-b border-gray_200 bg-white p-4 lg:hidden">
          {nav}
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-cream"
          >
            <Logout size={20} />
            Log out
          </button>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray_200 bg-white p-4 lg:flex">
        <Link href="/admin" className="px-3 py-2 font-bold text-primary-dark">
          {info.appName}
        </Link>
        <p className="px-3 pb-4 text-xs text-dark_gray">Admin panel</p>

        {nav}

        <button
          type="button"
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-cream"
        >
          <Logout size={20} />
          Log out
        </button>
      </aside>
    </>
  );
}
