// src/pages/ImageVerificationPage.jsx
//
// Moderator queue for verification requests (selfie face-match and ID
// documents). Uses the hooks already in moderationApi.js - no new endpoints
// are needed on the frontend.
//
// Expected item shape from GET admin/verifications (see the backend notes):
//   {
//     _id, documentType, documentUrl, status, rejectionReason, matchScore?,
//     createdAt,
//     userId: { _id, fullName, email? },          // populated
//     profileImage?: "/public/upload/abc.jpg"     // member's main photo
//   }


"use client"


import React, { useMemo, useState } from "react";
import {
    useGetVerificationsQuery,
    useReviewVerificationMutation,
} from "@/redux/features/moderationApi";

// Uploaded files are served by the API origin, not by this app.
const ASSET_BASE = (import.meta.env?.VITE_API_URL || "").replace(
    /\/api\/v1\/?$/,
    ""
);
const assetUrl = (p) => (!p ? "" : /^https?:/.test(p) ? p : `${ASSET_BASE}${p}`);

const STATUS_TABS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const TYPE_OPTIONS = [
    { value: "", label: "All types" },
    { value: "face", label: "Face match" },
    { value: "nid", label: "National ID" },
    { value: "passport", label: "Passport" },
];

const STATUS_STYLE = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
};

// Tolerates the list coming back as a bare array or wrapped in a page object.
const pickItems = (res) => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    return d?.items ?? d?.verifications ?? d?.docs ?? [];
};

function Photo({ src, label }) {
    const [broken, setBroken] = useState(false);
    return (
        <figure className="min-w-0 flex-1">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                {src && !broken ? (
                    <a href={assetUrl(src)} target="_blank" rel="noreferrer">
                        <img
                            src={assetUrl(src)}
                            alt={label}
                            onError={() => setBroken(true)}
                            className="h-full w-full object-cover"
                        />
                    </a>
                ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-500">
                        {src ? "Image could not be loaded" : "No image"}
                    </div>
                )}
            </div>
            <figcaption className="mt-1 text-xs text-neutral-600">{label}</figcaption>
        </figure>
    );
}

function RejectForm({ onCancel, onSubmit, busy }) {
    const [reason, setReason] = useState("");
    return (
        <div className="mt-3 space-y-2">
            <label className="block text-sm font-medium text-neutral-800">
                Reason for rejection
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Tell the member what to fix, e.g. the selfie is too dark."
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
            </label>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={busy || reason.trim().length < 5}
                    onClick={() => onSubmit(reason.trim())}
                    className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {busy ? "Rejecting…" : "Reject verification"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function VerificationCard({ item }) {
    const [review, { isLoading }] = useReviewVerificationMutation();
    const [rejecting, setRejecting] = useState(false);
    const [error, setError] = useState("");

    const isFace = item.documentType === "face";
    const member = item.userId?.fullName || "Unknown member";
    const isPending = item.status === "pending";

    const run = async (body) => {
        setError("");
        try {
            await review({ id: item._id, ...body }).unwrap();
            setRejecting(false);
        } catch (err) {
            setError(err?.data?.message || "Could not save the decision. Try again.");
        }
    };

    return (
        <article className="rounded-lg border border-neutral-200 bg-white p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-semibold text-neutral-900">{member}</h3>
                    <p className="text-sm text-neutral-600">
                        {isFace ? "Face match" : item.documentType?.toUpperCase()} request,
                        submitted {new Date(item.createdAt).toLocaleString()}
                    </p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status] || "bg-neutral-100 text-neutral-700"
                        }`}
                >
                    {item.status}
                </span>
            </header>

            <div className="mt-3 flex max-w-md gap-3">
                {isFace ? (
                    <>
                        <Photo src={item.documentUrl} label="Selfie" />
                        <Photo src={item.profileImage} label="Profile photo" />
                    </>
                ) : (
                    <Photo src={item.documentUrl} label="Submitted document" />
                )}
            </div>

            {typeof item.matchScore === "number" && (
                <p className="mt-2 text-sm text-neutral-700">
                    Match distance {item.matchScore.toFixed(3)} (lower is closer; the
                    automatic cut-off is 0.6).
                </p>
            )}

            {item.status === "rejected" && item.rejectionReason && (
                <p className="mt-2 text-sm text-red-700">
                    Rejected: {item.rejectionReason}
                </p>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                    {error}
                </p>
            )}

            {isPending && !rejecting && (
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => run({ status: "approved" })}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                        {isLoading ? "Saving…" : "Approve"}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => setRejecting(true)}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                        Reject
                    </button>
                </div>
            )}

            {isPending && rejecting && (
                <RejectForm
                    busy={isLoading}
                    onCancel={() => setRejecting(false)}
                    onSubmit={(rejectionReason) =>
                        run({ status: "rejected", rejectionReason })
                    }
                />
            )}
        </article>
    );
}

const ImageVerificationPage = () => {
    const [status, setStatus] = useState("pending");
    const [documentType, setDocumentType] = useState("");
    const [page, setPage] = useState(1);

    const params = useMemo(
        () => ({ status, documentType, page, limit: 12 }),
        [status, documentType, page]
    );
    const { data, isLoading, isFetching, isError, error, refetch } =
        useGetVerificationsQuery(params);

    const items = pickItems(data);
    const totalPages = data?.data?.totalPages ?? data?.data?.pages ?? 1;

    const changeStatus = (value) => {
        setStatus(value);
        setPage(1);
    };

    return (
        <section className="mx-auto max-w-5xl p-4 sm:p-6">
            <h1 className="text-2xl font-semibold text-neutral-900">
                Image verification
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
                Compare each selfie with the member's profile photo, or check a
                submitted ID, then approve or reject.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                    role="tablist"
                    aria-label="Filter by status"
                    className="inline-flex rounded-md border border-neutral-300 p-0.5"
                >
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            role="tab"
                            type="button"
                            aria-selected={status === tab.value}
                            onClick={() => changeStatus(tab.value)}
                            className={`rounded px-3 py-1.5 text-sm ${status === tab.value
                                ? "bg-neutral-900 text-white"
                                : "text-neutral-700 hover:bg-neutral-100"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <select
                    aria-label="Filter by type"
                    value={documentType}
                    onChange={(e) => {
                        setDocumentType(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
                >
                    {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={refetch}
                    className="text-sm text-neutral-700 underline underline-offset-2"
                >
                    {isFetching ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            <div className="mt-5 space-y-4">
                {isLoading && <p className="text-sm text-neutral-600">Loading requests…</p>}

                {isError && (
                    <p role="alert" className="text-sm text-red-700">
                        {error?.data?.message || "Could not load verification requests."}
                    </p>
                )}

                {!isLoading && !isError && items.length === 0 && (
                    <p className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600">
                        No {status} requests{documentType ? ` of this type` : ""}.
                    </p>
                )}

                {items.map((item) => (
                    <VerificationCard key={item._id} item={item} />
                ))}
            </div>

            {totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-neutral-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </nav>
            )}
        </section>
    );
};

export default ImageVerificationPage;