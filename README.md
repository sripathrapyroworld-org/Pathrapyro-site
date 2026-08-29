# Sri Pathra Pyro World

Public storefront + admin portal for the fireworks catalogue, Razorpay checkout, and delivery tracking.

**Recommended deployment (free + commercial use allowed):** [Netlify](https://netlify.com) + [Neon](https://neon.tech) Postgres + [Supabase](https://supabase.com) Storage.

## Local setup

```bash
npm install
cp .env.example .env
# Set DATABASE_URL to Neon Postgres (free pooled URL)
npx prisma db push
npm run db:seed
npm run dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin
- Admin login: `admin@pathrapyro.local` / `Admin@123`
- Demo customer: `karthik@example.com` / `Customer@123`

Without Supabase env vars, images save to `./uploads/` locally. With Razorpay keys set to `placeholder`, checkout runs in **demo mode**.

---

## Deploy on Netlify (free, commercial OK)

> Netlify Free allows **commercial sites** (unlike Vercel Hobby). No credit card required.

### Step 1 — Neon database (free)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → **Connection details** → copy the **pooled** connection string  
   (host contains `-pooler`)
3. Save as `DATABASE_URL`

### Step 2 — Supabase storage (free)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a project → **Storage** → **New bucket** → name it `uploads`
3. Make bucket **public** (toggle in bucket settings, or add a public read policy)
4. From **Settings → API**, copy:
   - Project URL → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
   - Bucket name → `SUPABASE_STORAGE_BUCKET` and `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (`uploads`)

### Step 3 — Netlify site (free)

1. Sign up at [netlify.com](https://netlify.com)
2. **Add new site → Import from Git** → select `Clivratech-org/Pathra-Pyro`
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run netlify-build`
   - Publish directory: `.next`
4. **Site configuration → Environment variables** — add all vars from `.env.example`:

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon pooled Postgres URL |
| `AUTH_SECRET` | Yes | Random 32+ char string |
| `AUTH_URL` | Yes | `https://yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://yourdomain.com` |
| `SUPABASE_URL` | Yes | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key |
| `SUPABASE_STORAGE_BUCKET` | Yes | `uploads` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Yes | `uploads` |
| `RAZORPAY_KEY_ID` | Yes | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Yes | From Razorpay dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Same as key ID |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Same as `GOOGLE_CLIENT_ID` |
| `ADMIN_*` | Seed only | See `.env.example` |

5. Click **Deploy site**

### Step 4 — First-time database setup

After Netlify deploy succeeds, run **once** on your machine with production env:

```bash
# Pull Netlify env vars (optional)
npx netlify-cli env:pull

npx prisma db push
npm run db:seed
```

This creates tables, admin user, and ~66 demo products with images uploaded to Supabase.

### Step 5 — Custom domains

In Netlify → **Domain management**, add:

- `yourdomain.com`
- `admin.yourdomain.com` (same site — middleware rewrites admin subdomain to `/admin`)

Update DNS at your registrar (or Cloudflare):

| Type | Name | Value |
|------|------|-------|
| CNAME | `@` or `www` | your-site.netlify.app |
| CNAME | `admin` | your-site.netlify.app |

Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com`, then redeploy.

### Google Sign-In setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth client ID** (Web application)
3. Add **Authorized JavaScript origins**: `http://localhost:3000`, `https://yourdomain.com`
4. Add **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`, `https://yourdomain.com/api/auth/callback/google`
5. Copy the client ID and secret into `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

---

## Free tier limits (300 products — well within limits)

| Service | Free limit | This site |
|---------|------------|-----------|
| Netlify | 100 GB bandwidth, 300 build min/mo | Fine for a regional shop |
| Neon | 0.5 GB database | 300 products ≈ few MB |
| Supabase | 1 GB storage | ~900–1500 product photos OK |

**Only paid item for client:** domain name (~₹500–1000/year).

---

## Features

- Full public catalogue (shop, categories, product detail, combos, quick order)
- Active campaign offers on live prices + server-side checkout validation
- Cart (localStorage + DB sync for logged-in customers)
- Guest or account checkout with Razorpay
- Google One Tap + Google sign-in for customers (90-day sessions)
- Order tracking with admin-uploaded courier/packaging photos
- Admin portal: products, combos, offers, leads, sales, settings
- Cloud image storage via Supabase (works on Netlify serverless)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + production build |
| `npm run netlify-build` | Same as build (used by Netlify CI) |
| `npm run start` | Start production server locally |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed demo data + upload images to Supabase |
| `npm run db:reset` | Reset DB + reseed |

## Prototypes

Original static HTML prototypes are in `/prototype` for reference.
