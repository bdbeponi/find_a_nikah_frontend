import Link from "next/link";
import { info } from "@/config/info";

/**
 * A CSS wordmark, not an uploaded image.
 *
 * The public site used to fetch a logo from settings; this panel has no
 * settings endpoint and no anonymous reader, so an image would be one request
 * and one flicker to render text we already have.
 */
export default function Logo({ className = "", compact = false }) {
  return (
    <Link
      href="/admin"
      aria-label={`${info.appName} admin home`}
      className={`font-outfit leading-none font-extrabold tracking-tight ${
        compact ? "text-lg" : "text-xl sm:text-2xl"
      } ${className}`}
    >
      <span className="text-primary">FIND A </span>
      <span className="text-gold-gradient">NIKAH</span>
    </Link>
  );
}
