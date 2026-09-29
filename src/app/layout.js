// src/app/layout.js

import "@/app/globals.css";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import ReduxProvider from "@/redux/reduxProvider/ReduxProvider";
import { info } from "@/config/info";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit-sans",
});

/**
 * A staff tool, so the metadata is deliberately bare: no Open Graph, no
 * description, no canonical. The public product is the mobile app, and the
 * only thing this site owes a crawler is "go away" - which robots.js says and
 * this repeats in the page itself, for the crawlers that ignore robots.txt.
 */
export const metadata = {
  title: {
    default: `${info.appName} ${info.panelName}`,
    template: `%s | ${info.appName}`,
  },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport = {
  themeColor: "#0f6b4f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-outfit antialiased">
        <ReduxProvider>{children}</ReduxProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
