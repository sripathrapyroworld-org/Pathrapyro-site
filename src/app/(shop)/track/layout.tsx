import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
