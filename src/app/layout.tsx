import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteProgress } from "@/components/route-progress";
import {
  buildMetadata,
  DEFAULT_DESCRIPTION,
  getSiteUrl,
  SEO_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo";
import "./globals.css";

const rootMeta = buildMetadata({
  title: "Best Sivakasi Crackers Online",
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${rootMeta.title} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: rootMeta.description,
  keywords: SEO_KEYWORDS,
  alternates: rootMeta.alternates,
  openGraph: rootMeta.openGraph,
  twitter: rootMeta.twitter,
  robots: rootMeta.robots,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
