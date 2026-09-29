"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { ArrowBack } from "@/components/icons";
import {
  useGetReportQuery,
  useResolveReportMutation,
} from "@/redux/features/moderationApi";
import { formatDate } from "@/utils/format";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-gray_200 py-3 last:border-0">
    <dt className="text-sm text-dark_gray">{label}</dt>
    <dd className="max-w-[60%] text-right text-sm font-medium text-ink">
      {children || "—"}
    </dd>
  </div>
);

export default function AdminReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading, isError } = useGetReportQuery(id);
  const [resolve, { isLoading: saving }] = useResolveReportMutation();

  const [note, setNote] = useState("");
  const [suspend, setSuspend] = useState(false);

  const report = data?.data?.report;
  const priorReports = data?.data?.priorReports ?? 0;
  const reported = report?.reportedUserId;

  const act = async (status) => {
    // Suspending somebody is not undone by pressing the button again, so it
    // asks first. Resolving and dismissing are reversible by reopening.
    if (suspend && status === "resolved") {
      const ok = window.confirm(
        `Suspend ${reported?.fullName}? They will be signed out of every device immediately.`
      );
      if (!ok) return;
    }

    try {
      const res = await resolve({
        id,
        status,
        resolutionNote: note.trim() || undefined,
        suspendUser: status === "resolved" ? suspend : false,
      }).unwrap();
      toast.success(res.message || "Updated");
      router.push("/admin/reports");
    } catch (err) {
      toast.error(err?.data?.message || "Could not update the report");
    }
  };

  if (isLoading) return <p className="text-sm text-dark_gray">Loading…</p>;

  if (isError || !report) {
    return (
      <>
        <p className="text-sm text-danger">Report not found.</p>
        <Link href="/admin/reports" className="btn btn-outline mt-4">
          <ArrowBack size={18} /> Back to reports
        </Link>
      </>
    );
  }

  const closed = ["resolved", "dismissed"].includes(report.status);

  return (
    <>
      <Link
        href="/admin/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-dark_gray hover:text-primary"
      >
        <ArrowBack size={18} /> Reports
      </Link>

      <AdminPageHeader
        title={report.reason?.replace(/_/g, " ")}
        subtitle={`Against ${reported?.fullName || "a deleted account"}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">The report</h2>
          <dl>
            <Row label="Status">
              <StatusBadge tone={closed ? "success" : "danger"}>
                {report.status}
              </StatusBadge>
            </Row>
            <Row label="Filed by">{report.reporterId?.phone}</Row>
            <Row label="Filed">{formatDate(report.createdAt)}</Row>
            <Row label="Reviewed">
              {report.reviewedAt ? formatDate(report.reviewedAt) : null}
            </Row>
          </dl>

          {report.description && (
            <>
              <h3 className="mt-4 mb-1 text-sm font-semibold text-ink">
                What they said
              </h3>
              {/* Member-written. Rendered as text, never as markup. */}
              <p className="text-sm whitespace-pre-wrap text-dark_gray">
                {report.description}
              </p>
            </>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-2 font-semibold text-primary-dark">
            The reported account
          </h2>
          <dl>
            <Row label="Phone">{reported?.phone}</Row>
            <Row label="Account">
              <StatusBadge
                tone={reported?.accountStatus === "active" ? "success" : "danger"}
              >
                {reported?.accountStatus}
              </StatusBadge>
            </Row>
            <Row label="Verified">{reported?.isVerified ? "Yes" : "No"}</Row>
            <Row label="Joined">{formatDate(reported?.createdAt)}</Row>
            {/* The number that usually decides what to do: one complaint is a
                disagreement, six is a pattern. */}
            <Row label="Other reports against them">
              {priorReports > 0 ? (
                <StatusBadge tone={priorReports >= 3 ? "danger" : "warning"}>
                  {priorReports}
                </StatusBadge>
              ) : (
                "none"
              )}
            </Row>
          </dl>
        </div>
      </div>

      {!closed && (
        <div className="card mt-4 max-w-2xl space-y-4 p-5">
          <div>
            <label className="label_field" htmlFor="note">
              Resolution note
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input_field"
              placeholder="What did you find, and what did you do?"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={suspend}
              onChange={(e) => setSuspend(e.target.checked)}
              className="size-4 accent-[var(--danger)]"
              disabled={reported?.accountStatus !== "active"}
            />
            Suspend this account when resolving
            {reported?.accountStatus !== "active" && (
              <span className="text-dark_gray">
                (already {reported?.accountStatus})
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => act("resolved")}
              className="btn btn-gold"
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => act("dismissed")}
              className="btn btn-outline"
            >
              Dismiss
            </button>
            {report.status === "open" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => act("reviewing")}
                className="btn btn-ghost"
              >
                Mark as reviewing
              </button>
            )}
          </div>
        </div>
      )}

      {closed && report.resolutionNote && (
        <div className="card mt-4 max-w-2xl p-5">
          <h2 className="mb-1 font-semibold text-primary-dark">Resolution</h2>
          <p className="text-sm whitespace-pre-wrap text-dark_gray">
            {report.resolutionNote}
          </p>
        </div>
      )}
    </>
  );
}
