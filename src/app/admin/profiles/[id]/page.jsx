"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { ArrowBack } from "@/components/icons";
import {
  useGetProfileQuery,
  useSetProfileStatusMutation,
} from "@/redux/features/moderationApi";
import { imageUrl } from "@/redux/url/url";
import { ageFrom, formatDate, formatNumber } from "@/utils/format";

const STATUS_TONE = {
  pending: "warning",
  published: "success",
  rejected: "danger",
  hidden: "neutral",
};

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-gray_200 py-3 last:border-0">
    <dt className="text-sm text-dark_gray">{label}</dt>
    <dd className="max-w-[60%] text-right text-sm font-medium text-ink">
      {children || "—"}
    </dd>
  </div>
);

const Card = ({ title, children, span }) => (
  <div className={`card p-5 ${span ? "lg:col-span-2" : ""}`}>
    <h2 className="mb-2 font-semibold text-primary-dark">{title}</h2>
    {children}
  </div>
);

export default function AdminProfilePage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useGetProfileQuery(id);
  const [setStatus, { isLoading: saving }] = useSetProfileStatusMutation();
  const [reason, setReason] = useState("");

  const profile = data?.data?.profile;
  const account = profile?.userId;
  const education = data?.data?.education || [];
  const profession = data?.data?.profession || [];
  const family = data?.data?.family;
  const preference = data?.data?.preference;
  const photos = data?.data?.photos || [];
  const reportCount = data?.data?.reportCount ?? 0;

  const act = async (status) => {
    // The backend refuses a reasonless rejection with a 400; catching it here
    // saves the round trip and puts the message next to the field.
    if (status === "rejected" && !reason.trim()) {
      toast.error("Give a reason so the member knows what to fix");
      return;
    }

    try {
      const res = await setStatus({
        id,
        status,
        rejectionReason: reason.trim() || undefined,
      }).unwrap();
      toast.success(res.message || "Updated");
      setReason("");
    } catch (err) {
      toast.error(err?.data?.message || "Could not update the profile");
    }
  };

  if (isLoading) return <p className="text-sm text-dark_gray">Loading…</p>;

  if (isError || !profile) {
    return (
      <>
        <p className="text-sm text-danger">Profile not found.</p>
        <Link href="/admin/profiles" className="btn btn-outline mt-4">
          <ArrowBack size={18} /> Back to profiles
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/admin/profiles"
        className="mb-4 inline-flex items-center gap-1 text-sm text-dark_gray hover:text-primary"
      >
        <ArrowBack size={18} /> Profiles
      </Link>

      <AdminPageHeader
        title={account?.fullName}
        subtitle={account?.phone}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || profile.profileStatus === "published"}
              onClick={() => act("published")}
              className="btn btn-gold"
            >
              Publish
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => act("rejected")}
              className="btn btn-outline"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={saving || profile.profileStatus === "hidden"}
              onClick={() => act("hidden")}
              className="btn btn-ghost"
            >
              Hide
            </button>
          </div>
        }
      />

      {/*
        Every photo, approved or not, whatever the member's visibility setting
        says. Deciding whether to publish somebody means looking at what they
        uploaded — this is the one screen where that filter is deliberately off.
        A plain <img> because next/image refuses a host it was not configured
        with at build time, which here would mean a broken box where the photo
        under review should be.
      */}
      {photos.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {photos.map((photo) => (
            <a
              key={photo._id}
              href={imageUrl(photo.url)}
              target="_blank"
              rel="noreferrer noopener"
              className="relative"
              title="Open full size"
            >
              <img
                src={imageUrl(photo.url)}
                alt=""
                className="size-28 rounded-lg bg-cream object-cover"
              />
              {!photo.isApproved && (
                <span className="absolute inset-x-1 bottom-1">
                  <StatusBadge tone={photo.rejectionReason ? "danger" : "warning"}>
                    {photo.rejectionReason ? "rejected" : "pending"}
                  </StatusBadge>
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Status">
          <dl>
            <Row label="Moderation">
              <span className="space-x-1">
                <StatusBadge tone={STATUS_TONE[profile.profileStatus]}>
                  {profile.profileStatus}
                </StatusBadge>
                {!profile.isDiscoverable && (
                  <StatusBadge>paused by member</StatusBadge>
                )}
              </span>
            </Row>
            <Row label="Account">
              <Link
                href={`/admin/members/${account?._id}`}
                className="hover:underline"
              >
                <StatusBadge
                  tone={account?.accountStatus === "active" ? "success" : "danger"}
                >
                  {account?.accountStatus}
                </StatusBadge>
              </Link>
            </Row>
            <Row label="Identity verified">
              {account?.isVerified ? "Yes" : "No"}
            </Row>
            <Row label="Completeness">{profile.completeness}%</Row>
            {/* The number that usually decides it: one complaint is a
                disagreement, six is a pattern. */}
            <Row label="Reports against them">
              {reportCount > 0 ? (
                <StatusBadge tone={reportCount >= 3 ? "danger" : "warning"}>
                  {reportCount}
                </StatusBadge>
              ) : (
                "none"
              )}
            </Row>
            <Row label="Submitted">{formatDate(profile.createdAt)}</Row>
            <Row label="Published">
              {profile.publishedAt ? formatDate(profile.publishedAt) : null}
            </Row>
            {profile.rejectionReason && (
              <Row label="Last rejection">{profile.rejectionReason}</Row>
            )}
          </dl>

          <label className="label_field mt-4" htmlFor="reason">
            Reason (required to reject)
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input_field"
            placeholder="What does the member need to change?"
          />
        </Card>

        <Card title="Details">
          <dl>
            <Row label="Looking as">
              {profile.gender === "male" ? "Groom" : "Bride"}
            </Row>
            <Row label="Age">{ageFrom(profile.dateOfBirth)}</Row>
            <Row label="Height">
              {profile.heightCm ? `${profile.heightCm} cm` : null}
            </Row>
            <Row label="Marital status">
              {profile.maritalStatus?.replace(/_/g, " ")}
            </Row>
            <Row label="Religion">{profile.religion}</Row>
            <Row label="Sect">{profile.sect}</Row>
            <Row label="Practising">
              {profile.religiousness?.replace(/_/g, " ")}
            </Row>
            <Row label="Mother tongue">{profile.motherTongue}</Row>
            <Row label="City">{profile.city}</Row>
            <Row label="Country">{profile.country}</Row>
          </dl>
        </Card>

        {profile.aboutMe && (
          <Card title="About" span>
            {/* Member-written text. Rendered as text, never as markup - and this
                is the field somebody uses to slip a phone number past review,
                which is why editing it sends the profile back to this queue. */}
            <p className="text-sm whitespace-pre-wrap text-ink">
              {profile.aboutMe}
            </p>
          </Card>
        )}

        {education.length > 0 && (
          <Card title="Education">
            <ul className="divide-y divide-gray_200">
              {education.map((row) => (
                <li key={row._id} className="py-3 text-sm">
                  <p className="font-medium text-ink">
                    {row.degree}
                    {row.fieldOfStudy ? ` · ${row.fieldOfStudy}` : ""}
                  </p>
                  <p className="text-dark_gray">
                    {row.institution}
                    {row.yearOfPassing ? ` · ${row.yearOfPassing}` : ""}
                    {row.grade ? ` · ${row.grade}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {profession.length > 0 && (
          <Card title="Profession">
            <ul className="divide-y divide-gray_200">
              {profession.map((row) => (
                <li key={row._id} className="py-3 text-sm">
                  <p className="font-medium text-ink">
                    {row.designation ? `${row.designation}, ` : ""}
                    {row.occupation}
                    {row.isCurrent && (
                      <StatusBadge tone="success">current</StatusBadge>
                    )}
                  </p>
                  <p className="text-dark_gray">
                    {row.company}
                    {row.workCity ? ` · ${row.workCity}` : ""}
                  </p>
                  {/* The moderator sees the income whatever the member's
                      visibility setting says — that setting is about other
                      members, and a salary is one of the things a fake profile
                      exaggerates. */}
                  {row.monthlyIncome != null && (
                    <p className="text-dark_gray">
                      ৳{formatNumber(row.monthlyIncome)} a month ·{" "}
                      {row.incomeVisibility?.replace(/_/g, " ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {family && (
          <Card title="Family">
            <dl>
              <Row label="Father">
                {family.fatherName}
                {family.fatherOccupation ? ` · ${family.fatherOccupation}` : ""}
              </Row>
              <Row label="Mother">
                {family.motherName}
                {family.motherOccupation ? ` · ${family.motherOccupation}` : ""}
              </Row>
              <Row label="Brothers">
                {`${family.brothers ?? 0} (${family.marriedBrothers ?? 0} married)`}
              </Row>
              <Row label="Sisters">
                {`${family.sisters ?? 0} (${family.marriedSisters ?? 0} married)`}
              </Row>
              <Row label="Family type">{family.familyType}</Row>
              <Row label="Standing">
                {family.familyStatus?.replace(/_/g, " ")}
              </Row>
              <Row label="Home district">{family.homeDistrict}</Row>
            </dl>
            {family.familyDetails && (
              <p className="mt-3 text-sm whitespace-pre-wrap text-dark_gray">
                {family.familyDetails}
              </p>
            )}
          </Card>
        )}

        {preference && (
          <Card title="Looking for">
            <dl>
              <Row label="Age">
                {preference.ageRange?.min || preference.ageRange?.max
                  ? `${preference.ageRange?.min ?? "any"} – ${
                      preference.ageRange?.max ?? "any"
                    }`
                  : null}
              </Row>
              <Row label="Height">
                {preference.heightRange?.min || preference.heightRange?.max
                  ? `${preference.heightRange?.min ?? "any"} – ${
                      preference.heightRange?.max ?? "any"
                    } cm`
                  : null}
              </Row>
              <Row label="Religion">
                {preference.preferredReligions?.join(", ")}
              </Row>
              <Row label="Marital status">
                {preference.maritalStatuses?.join(", ").replace(/_/g, " ")}
              </Row>
              <Row label="Cities">{preference.preferredCities?.join(", ")}</Row>
              <Row label="Verified only">
                {preference.verifiedOnly ? "Yes" : "No"}
              </Row>
            </dl>
          </Card>
        )}
      </div>
    </>
  );
}
