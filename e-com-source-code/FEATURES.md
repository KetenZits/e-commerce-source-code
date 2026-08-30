# Features

## Included

**Storefront**

- Catalog search, category/brand/price filters, sort, pagination
- Product gallery, variants, stock-aware cart, wishlist
- Guest checkout and account checkout
- PromptPay QR, slip upload, optional live slip APIs
- Order history, guest order access, customer cancellation
- Physical shipping zones and digital delivery after payment
- Reviews, recently viewed, back-in-stock waitlist
- SEO: sitemap, robots, Open Graph, Product JSON-LD
- Cookie banner and optional Plausible / Google Analytics (after consent)
- Thai / English storefront language switcher (cookie + html lang; catalog CMS copy stays as entered)
- Terms, privacy, returns, and contact pages driven by Storefront → Business

**Admin**

- Products (images, variants, SEO, physical/digital), categories
- Inventory adjustments with movement history
- Orders, refunds, promotions, reviews, shipping, payments
- Storefront CMS (copy, hero, orbit images, legal identity)
- Waitlist, notification logs, staff roles, audit log
- CSV export for products and orders
- Revenue dashboard

**Platform**

- Prisma migrations, CI (lint, typecheck, unit tests)
- Production env fail-closed for auth and encryption secrets
- Rate limits on auth/API routes, security headers
- Optional Redis, Meilisearch, Cloudflare R2, Resend, Discord, Telegram

## Not included

Do not advertise these as if they ship in the zip:

- Stripe, PayPal, credit cards, or non-Thai payment rails
- Multi-currency or translated catalog/CMS copy (product titles stay as you type them)
- Carrier APIs, shipping labels, or pickup booking
- Subscriptions, bundles, gift cards, loyalty, referrals
- Product compare, preorders, abandoned-cart email campaigns
- Multi-store / multi-tenant
- Cookie consent CMP certified for every jurisdiction
- Lawyer-reviewed Terms / PDPA / VAT opinions — pages are templates you must edit

Those are custom work, not missing files from a broken install.
