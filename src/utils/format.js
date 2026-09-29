// Display only.
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export const formatNumber = (n = 0) => Number(n || 0).toLocaleString("en-BD");

// A profile shows an age, never a date of birth - the birthday itself is
// nobody else's business.
export const ageFrom = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  // Their birthday has not come round yet this year
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

/**
 * Whether an account is live.
 *
 * The backend replaced the old `is_active` boolean with an accountStatus enum
 * (active / suspended / deleted), because a boolean could not tell "banned by
 * a moderator" from "closed by the member". Every screen only needs the yes/no,
 * so the comparison lives here rather than being spelled out seven times.
 */
export const isActive = (account) => account?.accountStatus === "active";

/** What to call the state, for a badge. */
export const statusLabel = (account) => account?.accountStatus || "unknown";

/**
 * Money, from the integer minor units the backend stores.
 *
 * The division happens here and only here. A price that has been through a
 * float on the way to the screen is a price that eventually renders as
 * ৳299.99000000000001 in somebody's receipt.
 */
export const formatMoney = (minor = 0, currency = "BDT") =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(minor || 0) / 100);
