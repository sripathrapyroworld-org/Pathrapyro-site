type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function SeoJsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path,
    })),
  };
}

export function organizationSchema(input: {
  name: string;
  url: string;
  logo: string;
  description: string;
  email: string;
  phone: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logo,
    description: input.description,
    email: input.email,
    telephone: input.phone,
    areaServed: { "@type": "Country", name: "India" },
  };
}

export function websiteSchema(input: { name: string; url: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    description: input.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${input.url}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessSchema(input: {
  name: string;
  url: string;
  description: string;
  address: string;
  cityLine: string;
  phone: string;
  email: string;
  hours: string;
  license: string;
  gstin: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    telephone: input.phone,
    email: input.email,
    openingHours: input.hours,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressLocality: input.cityLine,
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    priceRange: "₹₹",
    areaServed: [
      { "@type": "State", name: "Tamil Nadu" },
      { "@type": "Country", name: "India" },
    ],
    knowsAbout: ["Sivakasi crackers", "Sivakasi fireworks", "fireworks wholesale"],
    identifier: [
      { "@type": "PropertyValue", name: "Explosives License", value: input.license },
      { "@type": "PropertyValue", name: "GSTIN", value: input.gstin },
    ],
  };
}

export function productSchema(input: {
  name: string;
  description: string;
  url: string;
  image: string;
  sku: string;
  category: string;
  price: number;
  inStock: boolean;
  brand: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image,
    sku: input.sku,
    category: input.category,
    brand: { "@type": "Brand", name: input.brand },
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "INR",
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: input.brand },
    },
  };
}

export function itemListSchema(input: {
  name: string;
  url: string;
  items: { name: string; url: string; image?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: input.url,
    numberOfItems: input.items.length,
    itemListElement: input.items.slice(0, 50).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}
