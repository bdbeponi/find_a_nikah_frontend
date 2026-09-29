"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";
import { useBroadcastMutation } from "@/redux/features/billingApi";
import { useGetAuditLogQuery } from "@/redux/features/moderationApi";
import { formatDate, formatNumber } from "@/utils/format";

export default function AdminAnnouncementsPage() {
  const { data: meData } = useGetCurrentUserQuery();
  const [broadcast, { isLoading: sending }] = useBroadcastMutation();
  // Every past announcement, from the audit log — there is no separate record
  // of them, and one is exactly what somebody asks for after sending a typo.
  const { data: history } = useGetAuditLogQuery({
    action: "notification.broadcast",
    limit: 10,
  });

  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  const canSend = ["super_admin", "admin"].includes(meData?.data?.role);
  const entries = history?.data?.entries || [];

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    // An announcement cannot be unsent, so the confirm names the audience
    // rather than just asking "are you sure".
    const ok = window.confirm(
      `Send "${form.title}" to ${
        form.audience === "verified" ? "every verified member" : "every member"
      }? This cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await broadcast(form).unwrap();
      toast.success(res.message || "Sent");
      setForm({ title: "", body: "", audience: "all" });
    } catch (err) {
      toast.error(err?.data?.message || "Could not send it");
    }
  };

  if (!canSend) {
    return (
      <>
        <AdminPageHeader title="Announcements" />
        <EmptyState
          title="Not your screen"
          message="Announcements are sent by an admin or the owner."
        />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Announcements"
        subtitle="A notification in every member's app."
      />

      <form onSubmit={submit} className="card max-w-2xl space-y-4 p-5">
        <div>
          <label className="label_field" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            maxLength={200}
            value={form.title}
            onChange={set("title")}
            className="input_field"
            placeholder="Eid Mubarak from all of us"
          />
        </div>

        <div>
          <label className="label_field" htmlFor="body">
            Message
          </label>
          <textarea
            id="body"
            rows={4}
            maxLength={1000}
            value={form.body}
            onChange={set("body")}
            className="input_field"
          />
          <p className="mt-1 text-xs text-dark_gray">
            {form.body.length}/1000
          </p>
        </div>

        <div>
          <label className="label_field" htmlFor="audience">
            Who gets it
          </label>
          <select
            id="audience"
            value={form.audience}
            onChange={set("audience")}
            className="input_field"
          >
            <option value="all">Every active member</option>
            <option value="verified">Verified members only</option>
          </select>
          {/* Suspended and closed accounts are never included, and neither is
              staff — the backend decides that, not this dropdown. */}
          <p className="mt-1 text-xs text-dark_gray">
            Suspended and closed accounts are never included.
          </p>
        </div>

        <button type="submit" disabled={sending} className="btn btn-gold">
          {sending ? "Sending…" : "Send announcement"}
        </button>
      </form>

      {entries.length > 0 && (
        <div className="card mt-6 max-w-2xl p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">Sent before</h2>
          <ul className="divide-y divide-gray_200">
            {entries.map((entry) => (
              <li key={entry._id} className="py-3 text-sm">
                <p className="font-medium text-ink">{entry.note}</p>
                <p className="mt-1 text-dark_gray">
                  <StatusBadge>{entry.after?.audience || "all"}</StatusBadge>
                  <span className="ml-2">
                    {formatNumber(entry.after?.recipients)} members ·{" "}
                    {entry.actorId?.fullName || "removed"} ·{" "}
                    {formatDate(entry.createdAt)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
