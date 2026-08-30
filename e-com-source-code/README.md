# Atelier — Thai PromptPay e-commerce source

Next.js 16 storefront with admin, Prisma/MySQL, tRPC, NextAuth, and PromptPay checkout. The demo brand is **Atelier**. Change the name, legal details, and copy in **Admin → Storefront** before you take orders.

This is a starter for a small Thai shop that sells physical goods, digital goods, or both. It is not Shopify, Stripe Checkout, or a multi-tenant SaaS.

## What you get

- Storefront: catalog, product pages, cart, wishlist, guest checkout, reviews, recently viewed
- Payments: PromptPay QR, slip upload, optional SlipOK/EasySlip, demo mode for local testing
- Commerce: stock reservation, refunds, coupons, VAT settings, mixed physical/digital fulfillment
- Admin: products, categories, inventory ledger, orders, promotions, reviews, shipping, storefront CMS, waitlist, CSV export
- Ops: health check, CI, Prisma migrations, optional Redis/BullMQ worker, optional Meilisearch, optional Cloudflare R2

See [FEATURES.md](./FEATURES.md) for the full list and the features that are **not** included.

## Requirements

- Node.js 22+
- MySQL 8
- npm

Optional: Redis (background jobs), Meilisearch (search), Resend (email), Cloudflare R2 (uploads), SlipOK or EasySlip (live slip checks).

## Setup

```bash
cp .env.example .env
```

Minimum `.env` values:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | MySQL connection string |
| `NEXTAUTH_SECRET` | 32+ random characters |
| `DIGITAL_SECRETS_KEY` | Separate 32+ key for digital delivery encryption |
| `NEXTAUTH_URL` | Public site URL, e.g. `http://localhost:3000` |
| `PROMPTPAY_ID` | Your PromptPay mobile number or national ID (digits only) |
| `PAYMENT_MODE` | `demo` locally; `live` only after slip verification is configured |

Local database with Docker:

```bash
docker compose up -d
```

Then:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

`npm run db:seed` **deletes all store data** (orders, products, users) and recreates the demo catalog.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@atelier.dev` | `admin1234` |
| Buyer | `buyer@atelier.dev` | `buyer1234` |

Coupon after seed: `WELCOME10`. Change these passwords before production.

Admin is at `/admin`. Storefront CMS is at `/admin/storefront`.

Shoppers switch Thai / English with **ไทย | EN** in the header. The choice is stored in a `locale` cookie. Product titles and CMS copy stay as you typed them.

### Background worker

Payment expiry and notification retries use BullMQ when `REDIS_URL` is set:

```bash
npm run worker
```

Without Redis the app still runs; jobs fall back to in-process handling where implemented.

## Rebrand before launch

1. Admin → Storefront: store name, tagline, hero, orbit images, delivery copy
2. Admin → Storefront → Business: legal name, email, phone, address, return window, default Thai/English language
3. Admin → Payments: PromptPay ID and account name
4. Replace demo products and picsum orbit images with your photos
5. Replace the placeholder legal pages by saving business details (the pages read those fields)
6. Set production secrets; never reuse the demo `NEXTAUTH_SECRET`

## Production checklist

- [ ] `NODE_ENV=production`
- [ ] Unique `NEXTAUTH_SECRET` and `DIGITAL_SECRETS_KEY`
- [ ] `PAYMENT_MODE=live` only with SlipOK or EasySlip keys, or accept manual slip review
- [ ] `npx prisma migrate deploy` on a fresh database (do not use `db push` in production)
- [ ] HTTPS, real `NEXTAUTH_URL`
- [ ] Change seed admin password or create a new admin and delete demo users
- [ ] Legal name and contact email are yours, not `example.com`
- [ ] Optional: R2 for uploads, Redis + `npm run worker`, Resend for mail, Plausible or GA after cookie consent

Health endpoint: `GET /api/health`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright (needs a running app) |
| `npm run db:seed` | Reset demo data |
| `npm run worker` | BullMQ worker |

## License and third-party code

- Buyer license: [../LICENSE](../LICENSE)
- npm and UI attributions: [THIRD_PARTY.md](./THIRD_PARTY.md)
