import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 text-center">
      <div className="space-y-4">
        <p className="section-eyebrow">404</p>
        <h1 className="section-title">This page does not exist</h1>
        <p className="text-sm text-dark_gray">
          The link may be old, or the record may have been removed.
        </p>
        <Link href="/admin" className="btn btn-gold">
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
