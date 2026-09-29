import { Empty } from "@/components/icons";

export default function EmptyState({
  title = "Nothing here yet",
  message,
  action,
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-gray_200 px-6 py-14 text-center">
      <Empty size={34} className="text-gray_200" />
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-dark_gray">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
