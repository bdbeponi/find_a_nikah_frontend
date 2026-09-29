"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { clearToken } from "@/lib/auth";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";

// Mirrors ADMIN_ROLES in find_a_nikah_backend/src/constants.js.
const ADMIN_ROLES = ["super_admin", "admin", "moderator"];

/**
 * Hides the panel from anyone who is not staff.
 *
 * This is convenience, not security - it only decides what to paint. Every
 * admin route on the backend sits behind verifyJWT + isAdmin, so a member who
 * edits their way past this sees a screen of 401s and no data.
 *
 * Both failure paths end at /login, never at "/". "/" redirects to /admin,
 * which lands back here - sending a signed-in member there is an infinite
 * redirect and the browser simply spins.
 */
export default function AdminGuard({ children }) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetCurrentUserQuery();
  const role = data?.data?.role;
  const allowed = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      router.replace("/login");
      return;
    }

    if (!allowed) {
      // A member signed in on the staff panel. Their session is real, so it is
      // dropped rather than left to bounce them back here on every reload.
      clearToken();
      toast.error("This panel is for staff only");
      router.replace("/login");
    }
  }, [isLoading, isError, allowed, router]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-dark_gray">
        Checking your access…
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}
