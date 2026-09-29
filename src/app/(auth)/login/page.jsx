"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useLoginApiMutation } from "@/redux/features/authApi";
import { setToken } from "@/lib/auth";

// Mirrors ADMIN_ROLES in find_a_nikah_backend/src/constants.js.
const ADMIN_ROLES = ["super_admin", "admin", "moderator"];

export default function LoginPage() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginApiMutation();
  const [form, setForm] = useState({ phone: "", password: "" });

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form).unwrap();

      /**
       * A member's credentials are valid - the backend has no reason to refuse
       * them - but this panel is not for them. Turning them away here, before
       * the token is stored, keeps them off a screen that would answer 403 to
       * everything anyway.
       */
      if (!ADMIN_ROLES.includes(res.data?.user?.role)) {
        toast.error("This panel is for staff only");
        return;
      }

      setToken(res.data.accessToken);
      toast.success(res.message || "Signed in");
      router.push("/admin");
    } catch (err) {
      toast.error(err?.data?.message || "Sign in failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-primary-dark">Staff sign in</h1>
        <p className="mt-1 text-sm text-dark_gray">
          Use the phone number your account was created with.
        </p>
      </div>

      <div>
        <label className="label_field" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={onChange}
          className="input_field"
          placeholder="01XXXXXXXXX"
        />
      </div>

      <div>
        <label className="label_field" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          className="input_field"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn btn-gold w-full">
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
