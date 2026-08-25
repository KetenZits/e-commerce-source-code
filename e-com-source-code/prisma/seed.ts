import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { filesToTree, type PreviewFile } from "../src/lib/file-tree";

const db = new PrismaClient();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function product(input: {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  authorName: string;
  priceCents: number;
  techStack: string[];
  category: string;
  coverSnippet: { code: string; lang: string };
  files: PreviewFile[];
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
  demoUrl?: string;
}) {
  return {
    slug: input.slug,
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    authorName: input.authorName,
    priceCents: input.priceCents,
    currency: "THB",
    techStack: input.techStack,
    category: input.category,
    coverSnippet: input.coverSnippet,
    demoUrl: input.demoUrl,
    repoPreviewFiles: filesToTree(input.files),
    status: "PUBLISHED" as const,
    salesCount: input.salesCount,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

const products = [
  product({
    slug: "next-saas-kit",
    title: "next-saas-kit",
    tagline: "Auth, billing stubs, and an app shell — production-shaped, not a tutorial dump.",
    description: `A Next.js App Router starter with the parts you actually keep: session-aware layouts, a typed API layer, and a billing-ready user model.

## What's in the box
- App Router + Server Components
- Credentials + OAuth session wiring
- Organization/workspace skeleton
- Tailwind + shadcn/ui tokens

Preview files are representative. The paid archive is the full source.`,
    authorName: "Sourcecode",
    priceCents: 149000,
    techStack: ["Next.js", "TypeScript", "Tailwind"],
    category: "boilerplate",
    coverSnippet: {
      lang: "tsx",
      code: `export async function getWorkspace(id: string) {
  const session = await auth()
  if (!session) throw new Error("unauthorized")
  return db.workspace.findFirst({ where: { id, members: { some: { userId: session.user.id } } } })
}`,
    },
    files: [
      {
        path: "src/app/layout.tsx",
        language: "tsx",
        content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  )
}`,
      },
      {
        path: "src/lib/auth.ts",
        language: "ts",
        content: `export async function auth() {
  const session = await getServerSession(authOptions)
  return session
}

export function requireUser(session: Session | null) {
  if (!session?.user) throw new Error("unauthorized")
  return session.user
}`,
      },
      {
        path: "src/server/workspace.ts",
        language: "ts",
        content: `export async function getWorkspace(id: string) {
  const session = await auth()
  if (!session) throw new Error("unauthorized")
  return db.workspace.findFirst({
    where: { id, members: { some: { userId: session.user.id } } },
  })
}`,
      },
    ],
    salesCount: 213,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    demoUrl: "https://example.com",
  }),
  product({
    slug: "laravel-api-starter",
    title: "laravel-api-starter",
    tagline: "Sanctum, Form Requests, and a versioned API you can ship on Monday.",
    description: `A Laravel API skeleton with Sanctum tokens, policy-backed resources, and a consistent JSON envelope.

Built for teams that already know Laravel and do not want another blog tutorial.`,
    authorName: "Sourcecode",
    priceCents: 129000,
    techStack: ["Laravel", "PHP"],
    category: "api",
    coverSnippet: {
      lang: "php",
      code: `class StoreInvoiceRequest extends FormRequest
{
    public function rules(): array
    {
        return ['amount' => ['required', 'integer', 'min:1']];
    }
}`,
    },
    files: [
      {
        path: "app/Http/Requests/StoreInvoiceRequest.php",
        language: "php",
        content: `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1'],
            'currency' => ['required', 'in:THB,USD'],
        ];
    }
}`,
      },
      {
        path: "app/Http/Controllers/Api/InvoiceController.php",
        language: "php",
        content: `public function store(StoreInvoiceRequest $request)
{
    $invoice = Invoice::create($request->validated());
    return InvoiceResource::make($invoice);
}`,
      },
      {
        path: "routes/api.php",
        language: "php",
        content: `Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('invoices', InvoiceController::class);
});`,
      },
    ],
    salesCount: 481,
    createdAt: daysAgo(210),
    updatedAt: daysAgo(200),
  }),
  product({
    slug: "react-admin-grid",
    title: "react-admin-grid",
    tagline: "TanStack Table, URL state, and bulk actions without a UI-kit tax.",
    description: `A React admin data-grid kit: column visibility, saved views, and CSV export. Wired to URL search params so refresh does not lose the table.`,
    authorName: "Sourcecode",
    priceCents: 99000,
    techStack: ["React", "TypeScript", "Tailwind"],
    category: "dashboard",
    coverSnippet: {
      lang: "tsx",
      code: `const table = useReactTable({
  data,
  columns,
  state: { pagination, sorting },
  getCoreRowModel: getCoreRowModel(),
})`,
    },
    files: [
      {
        path: "src/grid/useGridState.ts",
        language: "ts",
        content: `export function useGridState() {
  const params = useSearchParams()
  return {
    page: Number(params.get("page") ?? 1),
    sort: params.get("sort") ?? "createdAt",
  }
}`,
      },
      {
        path: "src/grid/DataGrid.tsx",
        language: "tsx",
        content: `export function DataGrid({ data, columns }: GridProps) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  return <table>{/* rows */}</table>
}`,
      },
    ],
    salesCount: 156,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
  }),
  product({
    slug: "nuxt-commerce-ui",
    title: "nuxt-commerce-ui",
    tagline: "Product listing, cart drawer, and checkout steps in Nuxt 3.",
    description: `A Nuxt 3 storefront UI kit. Cart state lives in a composable; checkout is a three-step wizard with server-ready validation stubs.`,
    authorName: "Sourcecode",
    priceCents: 119000,
    techStack: ["Vue", "Nuxt", "TypeScript"],
    category: "ecommerce",
    coverSnippet: {
      lang: "ts",
      code: `export const useCart = () => {
  const items = useState<CartItem[]>("cart", () => [])
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0))
  return { items, total }
}`,
    },
    files: [
      {
        path: "composables/useCart.ts",
        language: "ts",
        content: `export const useCart = () => {
  const items = useState<CartItem[]>("cart", () => [])
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.qty, 0))
  return { items, total }
}`,
      },
      {
        path: "pages/checkout.vue",
        language: "vue",
        content: `<script setup lang="ts">
const step = ref<"address" | "pay" | "done">("address")
</script>`,
      },
    ],
    salesCount: 92,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(18),
  }),
  product({
    slug: "nestjs-auth-kit",
    title: "nestjs-auth-kit",
    tagline: "JWT, refresh rotation, and role guards without the usual copy-paste.",
    description: `NestJS auth module with access/refresh rotation, Redis-backed denylist hooks, and a predictable exception filter.`,
    authorName: "Sourcecode",
    priceCents: 139000,
    techStack: ["NestJS", "TypeScript"],
    category: "api",
    coverSnippet: {
      lang: "ts",
      code: `@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Get("licenses")
listLicenses() {
  return this.licenses.findActive()
}`,
    },
    files: [
      {
        path: "src/auth/auth.controller.ts",
        language: "ts",
        content: `@Post("login")
async login(@Body() dto: LoginDto) {
  return this.auth.login(dto.email, dto.password)
}`,
      },
      {
        path: "src/auth/refresh.service.ts",
        language: "ts",
        content: `async rotate(token: string) {
  const payload = await this.jwt.verifyAsync(token)
  await this.store.revoke(payload.jti)
  return this.issuePair(payload.sub)
}`,
      },
    ],
    salesCount: 64,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  }),
  product({
    slug: "astro-docs-ui",
    title: "astro-docs-ui",
    tagline: "A documentation theme with search, tabs, and MDX callouts.",
    description: `Astro content collections + a tight docs chrome. Search is wired for Pagefind; callouts and code tabs ship as MDX components.`,
    authorName: "Sourcecode",
    priceCents: 79000,
    techStack: ["Astro", "TypeScript", "Tailwind"],
    category: "cms",
    coverSnippet: {
      lang: "ts",
      code: `const docs = await getCollection("docs")
export const sidebar = docs
  .sort((a, b) => a.data.order - b.data.order)
  .map((doc) => ({ href: doc.slug, label: doc.data.title }))`,
    },
    files: [
      {
        path: "src/content.config.ts",
        language: "ts",
        content: `const docs = defineCollection({
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
})`,
      },
      {
        path: "src/components/Callout.mdx",
        language: "tsx",
        content: `export function Callout({ title, children }) {
  return <aside className="border-l-2 border-amber px-3 py-2">{title}{children}</aside>
}`,
      },
    ],
    salesCount: 38,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),
];

async function main() {
  await db.downloadLog.deleteMany();
  await db.review.deleteMany();
  await db.license.deleteMany();
  await db.order.deleteMany();
  await db.productAsset.deleteMany();
  await db.notificationLog.deleteMany();
  await db.product.deleteMany();
  await db.account.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const adminHash = await bcrypt.hash("admin1234", 10);
  const buyerHash = await bcrypt.hash("buyer1234", 10);

  await db.user.create({
    data: {
      email: "admin@sourcecode.dev",
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await db.user.create({
    data: {
      email: "buyer@sourcecode.dev",
      name: "Buyer",
      passwordHash: buyerHash,
      role: "BUYER",
    },
  });

  for (const item of products) {
    const created = await db.product.create({ data: item });
    await db.productAsset.create({
      data: {
        productId: created.id,
        r2Key: `products/${created.slug}/source.zip`,
        fileName: `${created.slug}.zip`,
        sizeBytes: 1_048_576,
        checksum: "demo-checksum",
      },
    });
  }

  console.log("Seeded 2 users and", products.length, "products");
  console.log("Admin  admin@sourcecode.dev / admin1234");
  console.log("Buyer  buyer@sourcecode.dev / buyer1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
