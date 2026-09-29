const tones = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-gray_200 text-dark_gray",
};

export default function StatusBadge({ children, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}
