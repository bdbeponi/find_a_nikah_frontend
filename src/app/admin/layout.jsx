import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin",
  // The panel has no business in a search index, and robots.js disallows
  // /admin already - this is the belt to that braces.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-cream lg:flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </AdminGuard>
  );
}
