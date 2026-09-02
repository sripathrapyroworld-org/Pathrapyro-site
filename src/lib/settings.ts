import { prisma } from "./prisma";

export type SiteSettings = {
  businessName: string;
  tagline: string;
  gstin: string;
  license: string;
  address: string;
  cityLine: string;
  phone: string;
  phone2: string;
  phone3: string;
  phone4: string;
  whatsapp: string;
  email: string;
  hours: string;
  mapEmbed: string;
  marquee: string;
  gstPercent: number;
  packingCharge: number;
  countdownEnabled: boolean;
  countdownEyebrow: string;
  countdownHeading: string;
  countdownEndsAt: string;
  countdownNote: string;
  countdownButtonLabel: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Sri Pathra Pyro World",
  tagline: "ALL KINDS OF CRACKERS & FANCY VARIETIES",
  gstin: "33AFRFS8857B1ZJ",
  license: "97/2025",
  address: "3/178C, Kalayarkurichi, Purnachandrapuram, Virudhunagar, Tamil Nadu – 626130",
  cityLine: "Kalayarkurichi, Purnachandrapuram – 626130",
  phone: "+91 93443 32430",
  phone2: "+91 97872 32430",
  phone3: "+91 80720 05632",
  phone4: "+91 99946 52096",
  whatsapp: "+91 99946 52096",
  email: "sripathrapyroworld@gmail.com",
  hours: "Mon–Sat: 9:00 AM – 8:30 PM · Sun: 10:00 AM – 6:00 PM",
  mapEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=77.93%2C9.56%2C77.97%2C9.60&layer=mapnik&marker=9.5810%2C77.9502",
  marquee: "🪔 Genuine Sivakasi Crackers — Direct Factory Rate — Licensed PESO Dealer — Safe Parcel Delivery Across Tamil Nadu 🪔",
  gstPercent: 18,
  packingCharge: 0,
  countdownEnabled: true,
  countdownEyebrow: "Offer ends in",
  countdownHeading: "Diwali Sale Countdown",
  countdownEndsAt: "2026-11-08T18:30:00.000Z",
  countdownNote: "",
  countdownButtonLabel: "Place Quick Order →",
};

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.setting.findUnique({ where: { id: "main" } });
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.data) as Partial<SiteSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gstPercent: Math.max(0, Number(parsed.gstPercent ?? DEFAULT_SETTINGS.gstPercent) || 0),
      packingCharge: Math.max(0, Math.round(Number(parsed.packingCharge ?? DEFAULT_SETTINGS.packingCharge) || 0)),
      countdownEnabled: parsed.countdownEnabled !== false,
      countdownEyebrow: String(parsed.countdownEyebrow ?? DEFAULT_SETTINGS.countdownEyebrow),
      countdownHeading: String(parsed.countdownHeading ?? DEFAULT_SETTINGS.countdownHeading),
      countdownEndsAt: String(parsed.countdownEndsAt ?? DEFAULT_SETTINGS.countdownEndsAt),
      countdownNote: String(parsed.countdownNote ?? DEFAULT_SETTINGS.countdownNote),
      countdownButtonLabel: String(parsed.countdownButtonLabel ?? DEFAULT_SETTINGS.countdownButtonLabel),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function toIstDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromIstDatetimeLocal(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_SETTINGS.countdownEndsAt;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? DEFAULT_SETTINGS.countdownEndsAt : parsed.toISOString();
  }
  const withSeconds = raw.length === 16 ? `${raw}:00` : raw;
  const parsed = new Date(`${withSeconds}+05:30`);
  return Number.isNaN(parsed.getTime()) ? DEFAULT_SETTINGS.countdownEndsAt : parsed.toISOString();
}

export async function saveSettings(data: SiteSettings) {
  await prisma.setting.upsert({
    where: { id: "main" },
    update: { data: JSON.stringify(data) },
    create: { id: "main", data: JSON.stringify(data) },
  });
}
