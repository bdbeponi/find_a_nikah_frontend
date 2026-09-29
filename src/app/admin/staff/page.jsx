"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";
import {
  useCreateStaffMutation,
  useGetStaffQuery,
  useSetStaffRoleMutation,
  useSetStaffStatusMutation,
} from "@/redux/features/adminApi";
import { formatDate, isActive, statusLabel } from "@/utils/format";

// Mirrors ASSIGNABLE_ROLES in the backend's admin.controllers.js. super_admin
// is deliberately absent: it is only created by `npm run seed`, on the server.
const ASSIGNABLE_ROLES = ["admin", "moderator"];

const blank = {
  fullName: "",
  phone: "",
  password: "",
  gender: "male",
  role: "moderator",
};

export default function AdminStaffPage() {
  const { data: meData } = useGetCurrentUserQuery();
  const me = meData?.data;
  const isSuperAdmin = me?.role === "super_admin";

  const { data, isLoading } = useGetStaffQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [setRole] = useSetStaffRoleMutation();
  const [setStatus] = useSetStaffStatusMutation();
  const [form, setForm] = useState(blank);

  const staff = data?.data || [];

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createStaff(form).unwrap();
      toast.success(res.message || "Staff account created");
      setForm(blank);
    } catch (err) {
      toast.error(err?.data?.message || "Could not create the account");
    }
  };

  const run = async (mutate, body, failure) => {
    try {
      const res = await mutate(body).unwrap();
      toast.success(res.message || "Updated");
    } catch (err) {
      toast.error(err?.data?.message || failure);
    }
  };

  return (
    <>
      <AdminPageHeader title="Team" subtitle="Admin and moderator accounts." />

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray_200 text-xs text-dark_gray uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                // The backend refuses both of these anyway; disabling them here
                // just stops someone clicking a button that can only fail.
                const isSelf = person._id === me?._id;
                const locked =
                  !isSuperAdmin || isSelf || person.role === "super_admin";

                return (
                  <tr
                    key={person._id}
                    className="border-b border-gray_200 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-ink">
                      {person.fullName}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-dark_gray">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark_gray">{person.phone}</td>
                    <td className="px-4 py-3">
                      {locked ? (
                        <StatusBadge>
                          {person.role.replace("_", " ")}
                        </StatusBadge>
                      ) : (
                        <select
                          value={person.role}
                          onChange={(e) =>
                            run(
                              setRole,
                              { id: person._id, role: e.target.value },
                              "Could not change the role"
                            )
                          }
                          className="input_field w-auto py-1.5"
                          aria-label={`Role for ${person.fullName}`}
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={isActive(person) ? "success" : "danger"}>
                        {statusLabel(person)}
                      </StatusBadge>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              setStatus,
                              { id: person._id, is_active: !isActive(person) },
                              "Could not change the status"
                            )
                          }
                          className="ml-2 text-xs font-semibold text-primary hover:underline"
                        >
                          {isActive(person) ? "Suspend" : "Reinstate"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark_gray">
                      {formatDate(person.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isSuperAdmin ? (
        <form onSubmit={onCreate} className="card mt-6 max-w-xl space-y-4 p-5">
          <div>
            <h2 className="font-semibold text-primary-dark">Add someone</h2>
            <p className="mt-1 text-sm text-dark_gray">
              They log in with this phone and password. Another super admin can
              only be made with the seed script, on the server.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label_field" htmlFor="staffName">
                Full name
              </label>
              <input
                id="staffName"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input_field"
              />
            </div>

            <div>
              <label className="label_field" htmlFor="staffPhone">
                Phone
              </label>
              <input
                id="staffPhone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input_field"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className="label_field" htmlFor="staffRole">
                Role
              </label>
              <select
                id="staffRole"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input_field"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label_field" htmlFor="staffGender">
                Gender
              </label>
              <select
                id="staffGender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input_field"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label_field" htmlFor="staffPassword">
              Password
            </label>
            <input
              id="staffPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input_field"
              placeholder="At least 8 characters"
            />
          </div>

          <button type="submit" disabled={creating} className="btn btn-gold">
            {creating ? "Creating…" : "Create account"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-dark_gray">
          Only a super admin can add or change staff accounts.
        </p>
      )}
    </>
  );
}
