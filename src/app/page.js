import { redirect } from "next/navigation";

// This app is the admin panel and nothing else - the member-facing product is
// a mobile app - so the root is just a signpost to /admin, which then bounces
// an unauthenticated visitor to /login.
export default function RootPage() {
  redirect("/admin");
}
