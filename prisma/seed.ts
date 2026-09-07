const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => any };
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { slugify } from "../src/lib/utils";
import { saveBuffer } from "../src/lib/uploads";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Sparklers", emoji: "✨", desc: "Hand sparklers of every size, from 3-inch electric to 12-inch color sparklers.", hue: 45 },
  { name: "Flower Pots", emoji: "🌸", desc: "Classic ground flower pots throwing colourful showers of sparks.", hue: 330 },
  { name: "Ground Chakkars", emoji: "🌀", desc: "Spinning ground wheels in a rainbow of colours and sizes.", hue: 200 },
  { name: "Rockets", emoji: "🚀", desc: "Sky rockets with whistle, colour-burst and double-sound effects.", hue: 15 },
  { name: "Bombs", emoji: "💥", desc: "Sound crackers including deluxe and mega sound variants.", hue: 0 },
  { name: "Fancy Items", emoji: "🎆", desc: "Multi-effect fancy fireworks for a spectacular aerial show.", hue: 280 },
  { name: "Kids Crackers", emoji: "🧒", desc: "Safe, low-noise crackers designed especially for children.", hue: 120 },
  { name: "Gift Boxes", emoji: "🎁", desc: "Pre-packed assortment boxes, perfect for gifting this Diwali.", hue: 25 },
  { name: "Shot Series", emoji: "🎯", desc: "Multi-shot aerial cakes with continuous colourful bursts.", hue: 260 },
  { name: "Digital Crackers", emoji: "📟", desc: "New-age digital effect crackers with vivid patterns.", hue: 190 },
  { name: "Matches", emoji: "🔥", desc: "Safety matches and lighters for hassle-free bursting.", hue: 35 },
  { name: "Combo Packs", emoji: "📦", desc: "Curated bundles combining our most popular items.", hue: 50 },
];

const PRODUCTS: Record<string, { name: string; mrp: number; sale: number; stock: number; featured?: boolean; pop: number; desc: string }[]> = {
  Sparklers: [
    { name: "Deluxe Color Sparkler 10cm", mrp: 120, sale: 65, stock: 340, featured: true, pop: 0.92, desc: "Classic 10cm colour sparklers with a bright, even burn. Pack of 10 sticks — ideal for kids and family photos." },
    { name: "Premium Electric Sparkler 15cm", mrp: 180, sale: 89, stock: 210, pop: 0.8, desc: "Electric-effect 15cm sparklers with a dense silver shower. Safe handheld fun for every age." },
    { name: "Classic Gold Sparkler 30cm", mrp: 240, sale: 110, stock: 180, featured: true, pop: 0.88, desc: "Long-burn gold sparklers that last well over a minute. Perfect for group celebrations." },
    { name: "Royal Color Sparkler 50cm", mrp: 360, sale: 165, stock: 95, pop: 0.7, desc: "Show-length 50cm colour-changing sparklers. A favourite for rooftop gatherings." },
    { name: "Super Long Sparkler 12-inch", mrp: 280, sale: 129, stock: 140, pop: 0.75, desc: "Twelve-inch super sparklers with a thick spark column and slow, even consumption." },
    { name: "Mega Rainbow Sparkler Pack", mrp: 450, sale: 199, stock: 70, pop: 0.66, desc: "Assorted rainbow pack — red, green, gold and electric mixed in one festive bundle." },
  ],
  "Flower Pots": [
    { name: "Premium Flower Pot Jumbo", mrp: 280, sale: 140, stock: 85, featured: true, pop: 0.9, desc: "Jumbo ground fountain throwing a tall colourful shower. 30–40 seconds of display." },
    { name: "Deluxe Mini Flower Pot", mrp: 90, sale: 45, stock: 400, pop: 0.72, desc: "Compact flower pot for small courtyards. Low smoke, bright gold spray." },
    { name: "Royal Color Flower Pot", mrp: 320, sale: 155, stock: 120, pop: 0.77, desc: "Multi-colour fountain with a peacock-like spray. A Diwali classic." },
    { name: "Super Giant Flower Pot", mrp: 520, sale: 249, stock: 60, featured: true, pop: 0.84, desc: "Giant fountain for open grounds. Dense sparks reaching well above head height." },
    { name: "Golden Shower Flower Pot", mrp: 210, sale: 99, stock: 150, pop: 0.68, desc: "Warm gold shower with a gentle crackle finish. Great for family photos." },
    { name: "Color Changing Flower Pot", mrp: 380, sale: 179, stock: 88, pop: 0.71, desc: "Transitions through green, gold and crimson in a single burn." },
  ],
  "Ground Chakkars": [
    { name: "Royal Ground Chakkar", mrp: 150, sale: 75, stock: 12, featured: true, pop: 0.86, desc: "Fast-spinning ground wheel with a bright gold ring. Pack of 10." },
    { name: "Deluxe Big Chakkar", mrp: 220, sale: 99, stock: 90, pop: 0.74, desc: "Oversized chakkar with a longer spin and louder whistle." },
    { name: "Color Chakkar Special", mrp: 180, sale: 85, stock: 110, pop: 0.69, desc: "Colour-tipped spinning wheels — red and green sparks on a gold base." },
    { name: "Mega Whistling Chakkar", mrp: 260, sale: 119, stock: 70, pop: 0.73, desc: "Whistle-effect chakkar that sings as it spins. Crowd favourite." },
    { name: "Classic Small Chakkar Pack", mrp: 80, sale: 39, stock: 320, pop: 0.61, desc: "Value pack of small chakkars for kids' corners and long evenings." },
    { name: "Premium Laser Chakkar", mrp: 340, sale: 159, stock: 45, pop: 0.65, desc: "Laser-bright spin with a tight, even circle. Premium grade." },
  ],
  Rockets: [
    { name: "Whistling Sky Rocket", mrp: 600, sale: 299, stock: 0, featured: true, pop: 0.95, desc: "High-whistle sky rocket with a colour burst at apogee. Currently restocking." },
    { name: "Deluxe Single Sound Rocket", mrp: 180, sale: 89, stock: 160, pop: 0.7, desc: "Classic single-sound rocket. Clean lift and a sharp report." },
    { name: "Premium Color Burst Rocket", mrp: 420, sale: 199, stock: 75, pop: 0.82, desc: "Colour-burst head with gold tail. Best fired from an open terrace." },
    { name: "Super Double Sound Rocket", mrp: 280, sale: 135, stock: 100, pop: 0.76, desc: "Two-stage sound rocket — lift crackle then a second sky report." },
    { name: "Mega Aerial Rocket Pack", mrp: 980, sale: 449, stock: 40, featured: true, pop: 0.88, desc: "Pack of 10 mixed aerial rockets for a full sky sequence." },
    { name: "Royal Whistle Color Rocket", mrp: 540, sale: 249, stock: 55, pop: 0.79, desc: "Whistle plus colour-change burst. A showpiece rocket." },
  ],
  Bombs: [
    { name: "Super Sound Bomb Pack", mrp: 340, sale: 180, stock: 150, featured: true, pop: 0.91, desc: "Deluxe sound bomb pack. Use only in open outdoor spaces, away from glass." },
    { name: "Classic Atom Bomb", mrp: 90, sale: 45, stock: 280, pop: 0.64, desc: "Traditional atom bomb with a clean, sharp report." },
    { name: "Deluxe Hydro Bomb", mrp: 160, sale: 79, stock: 190, pop: 0.67, desc: "Hydro-style sound cracker. Pack of 5." },
    { name: "Mega Thunder Bomb", mrp: 420, sale: 199, stock: 80, pop: 0.78, desc: "Heavy thunder report for open grounds only." },
    { name: "Premium Lakshmi Bomb", mrp: 220, sale: 110, stock: 130, pop: 0.72, desc: "Lakshmi bomb — a Sivakasi staple with consistent quality." },
    { name: "Royal Bullet Bomb Pack", mrp: 280, sale: 135, stock: 95, pop: 0.69, desc: "Bullet-style sound crackers in a value pack of 10." },
  ],
  "Fancy Items": [
    { name: "Fancy Peacock Fountain", mrp: 450, sale: 220, stock: 40, featured: true, pop: 0.93, desc: "Peacock-shaped fancy fountain with a spreading colour tail." },
    { name: "Deluxe Aerial Fancy Shot", mrp: 680, sale: 329, stock: 35, pop: 0.81, desc: "Single fancy aerial with crackling pistil and colour petals." },
    { name: "Premium Butterfly Fancy", mrp: 320, sale: 155, stock: 70, pop: 0.7, desc: "Ground fancy that opens into a butterfly spray of sparks." },
    { name: "Super 1000 Wala Fancy", mrp: 890, sale: 399, stock: 28, pop: 0.85, desc: "Long 1000-wala style fancy chain for a continuous crackle." },
    { name: "Royal Color Rain Fancy", mrp: 540, sale: 249, stock: 48, pop: 0.74, desc: "Colour-rain fountain with a glittering finish." },
    { name: "Mega Sky Fancy Combo", mrp: 1200, sale: 549, stock: 22, pop: 0.8, desc: "Assorted fancy aerials — five pieces for a mini sky show." },
  ],
  "Kids Crackers": [
    { name: "Kids Snake Tablet Pack", mrp: 90, sale: 45, stock: 8, featured: true, pop: 0.87, desc: "Low-smoke snake tablets. Supervise children; use on a flat plate." },
    { name: "Deluxe Pop Pop Pack", mrp: 60, sale: 29, stock: 500, pop: 0.6, desc: "Throw-down pop pops. Tiny reports, big smiles." },
    { name: "Premium Kids Sparkler Mini", mrp: 80, sale: 39, stock: 260, pop: 0.71, desc: "Short, cool-burning mini sparklers designed for little hands." },
    { name: "Super Flower Pencil", mrp: 110, sale: 55, stock: 180, pop: 0.66, desc: "Pencil fountain — a gentle gold spray kids can hold with an adult." },
    { name: "Royal Bijili Pack", mrp: 70, sale: 35, stock: 340, pop: 0.63, desc: "Classic bijili strips. Low intensity, long play time." },
    { name: "Mega Kids Fun Box", mrp: 480, sale: 219, stock: 50, pop: 0.83, desc: "Assorted low-noise kids items in one gift-ready box." },
  ],
  "Gift Boxes": [
    { name: "Family Gift Box Special", mrp: 1800, sale: 899, stock: 60, featured: true, pop: 0.96, desc: "Family assortment — sparklers, flower pots, chakkars, fancy items and a gift card." },
    { name: "Deluxe Couple Gift Box", mrp: 980, sale: 449, stock: 40, pop: 0.78, desc: "Compact gift box sized for a couple's terrace celebration." },
    { name: "Premium Corporate Gift Box", mrp: 2500, sale: 1199, stock: 25, pop: 0.73, desc: "Branded-ready corporate hamper with mixed premium crackers." },
    { name: "Super Kids Gift Box", mrp: 750, sale: 349, stock: 55, pop: 0.77, desc: "Kids-safe assortment packed in a colourful carton." },
    { name: "Royal Premium Gift Box", mrp: 3200, sale: 1499, stock: 18, pop: 0.86, desc: "Top-shelf gift box with shot series and fancy aerials included." },
    { name: "Mega Celebration Gift Box", mrp: 4500, sale: 1999, stock: 12, pop: 0.9, desc: "Our largest gift carton — enough for a full street celebration." },
  ],
  "Shot Series": [
    { name: "Deluxe 12 Shot Cake", mrp: 780, sale: 349, stock: 40, featured: true, pop: 0.89, desc: "Twelve-shot aerial cake with mixed colour bursts. Light once and enjoy." },
    { name: "Premium 25 Shot Cake", mrp: 1450, sale: 649, stock: 22, pop: 0.84, desc: "Twenty-five shot continuous aerial. Best in an open courtyard." },
    { name: "Super 50 Shot Display", mrp: 2800, sale: 1299, stock: 10, pop: 0.91, desc: "Half-minute aerial display. Keep 8 metres clearance." },
    { name: "Royal Color Shot 8s", mrp: 520, sale: 239, stock: 55, pop: 0.7, desc: "Eight-shot colour cake — an easy starter aerial." },
    { name: "Mega 100 Shot Finale", mrp: 5200, sale: 2299, stock: 6, pop: 0.94, desc: "Finale-grade 100 shot cake. Open ground only." },
    { name: "Classic Crackling Shot 16", mrp: 890, sale: 399, stock: 30, pop: 0.76, desc: "Sixteen crackling aerials with gold pistils." },
  ],
  "Digital Crackers": [
    { name: "Digital Neon Fountain", mrp: 640, sale: 299, stock: 35, featured: true, pop: 0.82, desc: "Neon-pattern digital fountain with vivid, almost LED-like colours." },
    { name: "Premium Pixel Shot 10", mrp: 980, sale: 449, stock: 20, pop: 0.79, desc: "Ten-shot digital aerial with geometric colour patterns." },
    { name: "Super Laser Wheel", mrp: 420, sale: 199, stock: 48, pop: 0.68, desc: "Ground digital wheel throwing laser-bright spokes." },
    { name: "Royal Hologram Fancy", mrp: 1100, sale: 499, stock: 16, pop: 0.74, desc: "Fancy item with a holographic colour-shift effect." },
    { name: "Mega Digital Sky Pack", mrp: 2100, sale: 949, stock: 9, pop: 0.81, desc: "Mixed digital aerial pack — four pieces." },
    { name: "Classic LED Sparkler Bar", mrp: 260, sale: 119, stock: 90, pop: 0.62, desc: "Bar-style digital sparkler with a dense, even neon shower." },
  ],
  Matches: [
    { name: "Safety Match Box Pack", mrp: 40, sale: 20, stock: 800, pop: 0.5, desc: "PESO-safe match boxes. Pack of 10." },
    { name: "Deluxe Long Match Sticks", mrp: 70, sale: 35, stock: 400, pop: 0.55, desc: "Long fireplace-style matches for lighting fountains safely." },
    { name: "Premium Windproof Lighter", mrp: 180, sale: 89, stock: 120, pop: 0.58, desc: "Windproof lighter for outdoor bursting nights." },
    { name: "Super Agarbatti Match Combo", mrp: 90, sale: 45, stock: 220, pop: 0.52, desc: "Matches plus incense — light the evening the traditional way." },
    { name: "Royal Safety Match Carton", mrp: 220, sale: 99, stock: 80, pop: 0.48, desc: "Bulk carton of safety matches for the whole season." },
    { name: "Classic Pocket Lighter", mrp: 60, sale: 29, stock: 300, pop: 0.44, desc: "Simple refillable pocket lighter." },
  ],
};

const COMBOS = [
  { tier: "Budget Pack", name: "Diwali Budget Pack", items: ["10 Sparklers", "5 Ground Chakkars", "5 Flower Pots", "2 Bombs Packs"], mrp: 1200, sale: 499 },
  { tier: "Kids Pack", name: "Kids Special Pack", items: ["Kids Sparklers", "Low-noise Poppers", "Fancy Kids Items", "Fountain Small"], mrp: 900, sale: 399 },
  { tier: "Family Pack", name: "Family Celebration Pack", items: ["20 Sparklers", "10 Flower Pots", "5 Rockets", "5 Chakkars", "3 Fancy Items"], mrp: 2800, sale: 1299 },
  { tier: "Premium Pack", name: "Premium Assorted Pack", items: ["Shot Series x2", "Fancy Items x5", "Rockets x10", "Gift Box Special"], mrp: 5200, sale: 2199 },
  { tier: "Mega Pack", name: "Mega Celebration Bundle", items: ["Everything in Family Pack", "Shot Series x3", "Digital Crackers x5", "Premium Gift Box"], mrp: 9800, sale: 3999 },
];

function svgPlaceholder(label: string, emoji: string, hue: number, variant = 0) {
  const h = (hue + variant * 18) % 360;
  const c1 = `hsl(${h}, 70%, 28%)`;
  const c2 = `hsl(${(h + 40) % 360}, 80%, 42%)`;
  const c3 = `hsl(${(h + 80) % 360}, 75%, 52%)`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="680" viewBox="0 0 800 680">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="rgba(255,220,140,0.45)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="680" fill="url(#g)"/>
  <rect width="800" height="680" fill="url(#r)"/>
  <circle cx="140" cy="120" r="8" fill="#e8b94d" opacity="0.8"/>
  <circle cx="660" cy="90" r="5" fill="#ff8a2b" opacity="0.9"/>
  <circle cx="720" cy="240" r="6" fill="#ff5a3c" opacity="0.7"/>
  <circle cx="80" cy="500" r="7" fill="#f4d78a" opacity="0.7"/>
  <text x="400" y="300" text-anchor="middle" font-size="92">${emoji}</text>
  <text x="400" y="390" text-anchor="middle" fill="#faf1e0" font-family="Georgia, serif" font-size="28" font-weight="700">${escapeXml(label)}</text>
  <text x="400" y="430" text-anchor="middle" fill="#e8b94d" font-family="monospace" font-size="14" letter-spacing="3">SRI PATHRA PYRO WORLD</text>
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function writeSvg(relDir: string, filename: string, svg: string) {
  const { mkdir, writeFile } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "media", relDir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), svg, "utf8");
  // Best-effort CDN mirror (ignored if bucket missing)
  try {
    await saveBuffer(Buffer.from(svg, "utf8"), relDir, filename, "image/svg+xml");
  } catch {
    /* local /public/media is the source of truth for seed art */
  }
  return `/media/${relDir}/${filename}`;
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.shipmentPhoto.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.comboPack.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.setting.create({
    data: { id: "main", data: JSON.stringify(DEFAULT_SETTINGS) },
  });

  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10);
  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "Sri Pathra Pyro Admin",
      email: (process.env.ADMIN_EMAIL || "admin@pathrapyro.local").toLowerCase(),
      phone: process.env.ADMIN_PHONE || "9843211234",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const demoHash = await bcrypt.hash("Customer@123", 10);
  await prisma.user.create({
    data: {
      name: "Karthik Raja",
      email: "karthik@example.com",
      phone: "9842103456",
      passwordHash: demoHash,
      role: "CUSTOMER",
      address: "12, East Car Street, Madurai",
      pincode: "625001",
    },
  });

  const catMap: Record<string, string> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const cover = await writeSvg("categories", `${slugify(c.name)}.svg`, svgPlaceholder(c.name, c.emoji, c.hue, 0));
    const row = await prisma.category.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        emoji: c.emoji,
        description: c.desc,
        coverPath: cover,
        sortOrder: i,
      },
    });
    catMap[c.name] = row.id;
  }

  for (const [catName, items] of Object.entries(PRODUCTS)) {
    const hue = CATEGORIES.find((c) => c.name === catName)?.hue ?? 40;
    const emoji = CATEGORIES.find((c) => c.name === catName)?.emoji ?? "🎆";
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const slug = slugify(p.name);
      const img1 = await writeSvg("products", `${slug}-1.svg`, svgPlaceholder(p.name, emoji, hue, i));
      const img2 = await writeSvg("products", `${slug}-2.svg`, svgPlaceholder(p.name, emoji, hue + 25, i + 3));
      const img3 = await writeSvg("products", `${slug}-3.svg`, svgPlaceholder("Detail view", emoji, hue + 50, i + 6));
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.desc,
          categoryId: catMap[catName],
          mrp: p.mrp,
          salePrice: p.sale,
          stock: p.stock,
          featured: Boolean(p.featured),
          popularity: p.pop,
          images: {
            create: [
              { path: img1, alt: p.name, sortOrder: 0, isCover: true },
              { path: img2, alt: `${p.name} angle`, sortOrder: 1, isCover: false },
              { path: img3, alt: `${p.name} detail`, sortOrder: 2, isCover: false },
            ],
          },
        },
      });
    }
  }

  for (let i = 0; i < COMBOS.length; i++) {
    const c = COMBOS[i];
    const img = await writeSvg("combos", `${slugify(c.name)}.svg`, svgPlaceholder(c.name, "📦", 42, i * 4));
    await prisma.comboPack.create({
      data: {
        tier: c.tier,
        name: c.name,
        slug: slugify(c.name),
        itemsJson: JSON.stringify(c.items),
        mrp: c.mrp,
        salePrice: c.sale,
        imagePath: img,
        sortOrder: i,
      },
    });
  }

  const sparklerId = catMap["Sparklers"];
  const giftId = catMap["Gift Boxes"];
  const kidsId = catMap["Kids Crackers"];

  await prisma.offer.createMany({
    data: [
      { title: "Early Bird Diwali Offer", pct: 40, appliesTo: "ALL", startDate: new Date("2026-09-01"), endDate: new Date("2026-09-15"), status: "expired", usedPct: 100 },
      { title: "Mega Combo Blast", pct: 65, appliesTo: "COMBOS", startDate: new Date("2026-09-20"), endDate: new Date("2026-10-31"), status: "active", usedPct: 62 },
      { title: "Sparkler Season Sale", pct: 55, appliesTo: "CATEGORY", categoryId: sparklerId, startDate: new Date("2026-10-01"), endDate: new Date("2026-11-08"), status: "active", usedPct: 38 },
      { title: "Gift Box Bulk Offer", pct: 50, appliesTo: "CATEGORY", categoryId: giftId, startDate: new Date("2026-10-01"), endDate: new Date("2026-11-08"), status: "active", usedPct: 44 },
      { title: "Last Minute Flash Sale", pct: 90, appliesTo: "ALL", startDate: new Date("2026-11-05"), endDate: new Date("2026-11-08"), status: "paused", usedPct: 5 },
      { title: "Kids Special Discount", pct: 45, appliesTo: "CATEGORY", categoryId: kidsId, startDate: new Date("2026-10-10"), endDate: new Date("2026-11-08"), status: "active", usedPct: 71 },
    ],
  });

  await prisma.lead.createMany({
    data: [
      { name: "Karthik Raja", phone: "+91 98421 03456", interest: "Family Combo Pack", source: "WhatsApp", status: "new" },
      { name: "Divya Shree", phone: "+91 97865 22110", interest: "Gift Boxes (Bulk)", source: "Phone Call", status: "contacted" },
      { name: "Muthu Kumar", phone: "+91 96294 88213", interest: "Sparklers 12-inch", source: "Website Enquiry", status: "converted" },
      { name: "Lakshmi Priya", phone: "+91 90475 66723", interest: "Kids Crackers Pack", source: "Walk-in", status: "converted" },
      { name: "Selvam R.", phone: "+91 89039 12456", interest: "Mega Combo Pack", source: "WhatsApp", status: "new" },
      { name: "Anitha M.", phone: "+91 91503 44890", interest: "Shot Series", source: "Phone Call", status: "lost" },
      { name: "Bala Subramaniam", phone: "+91 98765 30021", interest: "Digital Crackers", source: "Website Enquiry", status: "contacted" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
