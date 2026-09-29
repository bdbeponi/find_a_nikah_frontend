"use client";

import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function Pagination({ pagination, onPageChange }) {
  const {
    currentPage = 1,
    totalPages = 1,
    hasPrev,
    hasNext,
  } = pagination || {};
  if (totalPages <= 1) return null;

  // Window of at most 5 page numbers around the current page
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => start + i
  );

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={!hasPrev}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="btn btn-ghost px-2 disabled:opacity-40"
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`size-9 rounded-full text-sm font-semibold transition ${
            page === currentPage
              ? "bg-primary text-white"
              : "text-ink hover:bg-gray_200"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="btn btn-ghost px-2 disabled:opacity-40"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}
