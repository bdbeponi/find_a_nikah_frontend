"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import {
  useGetPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useRetirePlanMutation,
} from "@/redux/features/billingApi";
import { useGetCurrentUserQuery } from "@/redux/features/authApi";
import { formatMoney, formatNumber } from "@/utils/format";

// The five switches a plan actually sells. Kept in step with the `features`
// block on the backend's SubscriptionPlan schema.
const FEATURES = [
  ["canSeeWhoLikedMe", "See who liked them"],
  ["canMessageBeforeMatch", "Message before matching"],
  ["canSeeContactDetails", "See contact details of matches"],
  ["boostedInSearch", "Shown first in search"],
];

const blank = {
  name: "",
  description: "",
  priceTaka: "",
  durationDays: 30,
  maxLikesPerDay: 10,
  canSeeWhoLikedMe: false,
  canMessageBeforeMatch: false,
  canSeeContactDetails: false,
  boostedInSearch: false,
};

const toForm = (plan) => ({
  name: plan.name,
  description: plan.description || "",
  // Taka in the form, poisha on the wire. The admin types what the customer
  // pays; the backend stores integers so nobody's receipt ever reads 299.99000001.
  priceTaka: String((plan.priceMinor || 0) / 100),
  durationDays: plan.durationDays,
  maxLikesPerDay: plan.features?.maxLikesPerDay ?? 10,
  canSeeWhoLikedMe: Boolean(plan.features?.canSeeWhoLikedMe),
  canMessageBeforeMatch: Boolean(plan.features?.canMessageBeforeMatch),
  canSeeContactDetails: Boolean(plan.features?.canSeeContactDetails),
  boostedInSearch: Boolean(plan.features?.boostedInSearch),
});

const toBody = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || undefined,
  priceMinor: Math.round(Number(form.priceTaka || 0) * 100),
  durationDays: Number(form.durationDays),
  features: {
    maxLikesPerDay: Number(form.maxLikesPerDay),
    canSeeWhoLikedMe: form.canSeeWhoLikedMe,
    canMessageBeforeMatch: form.canMessageBeforeMatch,
    canSeeContactDetails: form.canSeeContactDetails,
    boostedInSearch: form.boostedInSearch,
  },
});

export default function AdminPlansPage() {
  const { data, isLoading } = useGetPlansQuery();
  const { data: meData } = useGetCurrentUserQuery();
  const [createPlan, { isLoading: creating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdatePlanMutation();
  const [retirePlan] = useRetirePlanMutation();

  // A moderator can read this screen - support questions land here - but the
  // backend refuses their writes, so the forms are not offered to them.
  const canEdit = ["super_admin", "admin"].includes(meData?.data?.role);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const plans = data?.data || [];
  const saving = creating || updating;

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const open = (plan) => {
    setEditing(plan?._id || "new");
    setForm(plan ? toForm(plan) : blank);
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      const body = toBody(form);
      const res =
        editing === "new"
          ? await createPlan(body).unwrap()
          : await updatePlan({ id: editing, ...body }).unwrap();

      toast.success(res.message || "Saved");
      setEditing(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not save the plan");
    }
  };

  const retire = async (plan) => {
    const ok = window.confirm(
      `Retire ${plan.name}? Nobody new can buy it. The ${plan.subscribers} people already on it keep what they paid for.`
    );
    if (!ok) return;

    try {
      const res = await retirePlan(plan._id).unwrap();
      toast.success(res.message || "Retired");
    } catch (err) {
      toast.error(err?.data?.message || "Could not retire the plan");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Plans"
        subtitle="What members can buy, and what it unlocks."
        action={
          canEdit && !editing ? (
            <button type="button" onClick={() => open(null)} className="btn btn-gold">
              New plan
            </button>
          ) : null
        }
      />

      {editing && (
        <form onSubmit={submit} className="card mb-6 space-y-4 p-5">
          <h2 className="font-semibold text-primary-dark">
            {editing === "new" ? "New plan" : "Edit plan"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label_field" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={set("name")}
                className="input_field"
              />
            </div>

            <div>
              <label className="label_field" htmlFor="price">
                Price (৳)
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.priceTaka}
                onChange={set("priceTaka")}
                className="input_field"
              />
            </div>

            <div>
              <label className="label_field" htmlFor="duration">
                Runs for (days)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                required
                value={form.durationDays}
                onChange={set("durationDays")}
                className="input_field"
              />
            </div>

            <div>
              <label className="label_field" htmlFor="likes">
                Likes per day
              </label>
              <input
                id="likes"
                type="number"
                min="0"
                required
                value={form.maxLikesPerDay}
                onChange={set("maxLikesPerDay")}
                className="input_field"
              />
            </div>
          </div>

          <div>
            <label className="label_field" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={set("description")}
              className="input_field"
            />
          </div>

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="label_field">What it unlocks</legend>
            {FEATURES.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={set(key)}
                  className="size-4 accent-[var(--primary)]"
                />
                {label}
              </label>
            ))}
          </fieldset>

          {/* Editing a plan does not change anybody already on it - their terms
              were copied onto their subscription when they paid. */}
          {editing !== "new" && (
            <p className="text-xs text-dark_gray">
              Changes apply to new purchases only. Existing subscribers keep the
              terms they bought.
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-gold">
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-dark_gray">Loading…</p>
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          message="Add one, or run npm run seed:plans on the backend."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan._id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-primary-dark">{plan.name}</h3>
                  <p className="text-2xl font-bold text-ink">
                    {formatMoney(plan.priceMinor, plan.currency)}
                  </p>
                  <p className="text-sm text-dark_gray">
                    for {formatNumber(plan.durationDays)} days
                  </p>
                </div>
                <StatusBadge tone={plan.isActive ? "success" : "neutral"}>
                  {plan.isActive ? "on sale" : "retired"}
                </StatusBadge>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-dark_gray">
                <li>{formatNumber(plan.features?.maxLikesPerDay)} likes a day</li>
                {FEATURES.filter(([key]) => plan.features?.[key]).map(([key, label]) => (
                  <li key={key}>{label}</li>
                ))}
              </ul>

              <p className="mt-3 text-sm font-medium text-ink">
                {formatNumber(plan.subscribers)} subscriber
                {plan.subscribers === 1 ? "" : "s"}
              </p>

              {canEdit && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => open(plan)}
                    className="btn btn-outline"
                  >
                    Edit
                  </button>
                  {plan.isActive && (
                    <button
                      type="button"
                      onClick={() => retire(plan)}
                      className="btn btn-ghost"
                    >
                      Retire
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
