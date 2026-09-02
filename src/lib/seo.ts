import type { Metadata } from "next";

export const SITE_NAME = "Sri Pathra Pyro World";

export const DEFAULT_SITE_URL = "https://sripathrapyrocrakers.com";

export const SEO_KEYWORDS = [
  "Sivakasi crackers",
  "Sivakasi crackers online",
  "buy Sivakasi crackers",
  "crackers online Sivakasi",
  "Sivakasi fireworks",
  "fireworks online Sivakasi",
  "Sivakasi crackers price",
  "Sivakasi crackers wholesale",
  "crackers wholesale Sivakasi",
  "Sivakasi crackers shop",
  "best crackers in Sivakasi",
  "original Sivakasi crackers",
  "Sivakasi fireworks online",
  "Virudhunagar crackers",
  "Tamil Nadu fireworks delivery",
];

export const DEFAULT_DESCRIPTION =
  "Buy original Sivakasi crackers online at factory-direct prices. Retail & wholesale fireworks — 500+ varieties, licensed dealer, delivery across Tamil Nadu.";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateDescription(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

type BuildMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = "/images/logo.png",
  noIndex = false,
  keywords = SEO_KEYWORDS,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const desc = truncateDescription(description);

  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [{ url: imageUrl, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [imageUrl],
    },
  };
}

export const privatePageMetadata = buildMetadata({
  title: "Private",
  description: "Private page",
  noIndex: true,
});

export const PUBLIC_STATIC_ROUTES = [
  "/",
  "/shop",
  "/combos",
  "/quick-order",
  "/about",
  "/contact",
  "/legal",
] as const;

export const ROBOTS_DISALLOW = [
  "/admin/",
  "/api/",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/account/",
  "/order/",
  "/track/",
];
