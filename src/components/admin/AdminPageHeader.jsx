export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-primary-dark sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-dark_gray">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
