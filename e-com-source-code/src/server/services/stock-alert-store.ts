import { nanoid } from "nanoid";
import type { PrismaClient } from "@/generated/prisma/client";

type SqlClient = Pick<PrismaClient, "$queryRaw" | "$executeRaw">;

export type StockAlertListItem = {
  id: string;
  email: string;
  notifiedAt: Date | null;
  createdAt: Date;
  product: { title: string; slug: string };
  variant: { sku: string };
};

export async function upsertStockAlert(
  db: SqlClient,
  input: { email: string; productId: string; variantId: string },
) {
  await db.$executeRaw`
    INSERT INTO \`StockAlert\` (\`id\`, \`email\`, \`productId\`, \`variantId\`, \`notifiedAt\`, \`createdAt\`)
    VALUES (${nanoid()}, ${input.email}, ${input.productId}, ${input.variantId}, NULL, NOW(3))
    ON DUPLICATE KEY UPDATE \`notifiedAt\` = NULL
  `;
}

export async function listStockAlerts(db: SqlClient): Promise<StockAlertListItem[]> {
  const rows = await db.$queryRaw<
    {
      id: string;
      email: string;
      notifiedAt: Date | null;
      createdAt: Date;
      title: string;
      slug: string;
      sku: string;
    }[]
  >`
    SELECT
      a.\`id\`,
      a.\`email\`,
      a.\`notifiedAt\`,
      a.\`createdAt\`,
      p.\`title\`,
      p.\`slug\`,
      v.\`sku\`
    FROM \`StockAlert\` a
    INNER JOIN \`Product\` p ON p.\`id\` = a.\`productId\`
    INNER JOIN \`ProductVariant\` v ON v.\`id\` = a.\`variantId\`
    ORDER BY a.\`createdAt\` DESC
    LIMIT 500
  `;

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    notifiedAt: row.notifiedAt,
    createdAt: row.createdAt,
    product: { title: row.title, slug: row.slug },
    variant: { sku: row.sku },
  }));
}

export async function pendingStockAlertsForVariant(db: SqlClient, variantId: string) {
  return db.$queryRaw<
    {
      id: string;
      email: string;
      title: string;
      slug: string;
      sku: string;
    }[]
  >`
    SELECT
      a.\`id\`,
      a.\`email\`,
      p.\`title\`,
      p.\`slug\`,
      v.\`sku\`
    FROM \`StockAlert\` a
    INNER JOIN \`Product\` p ON p.\`id\` = a.\`productId\`
    INNER JOIN \`ProductVariant\` v ON v.\`id\` = a.\`variantId\`
    WHERE a.\`variantId\` = ${variantId} AND a.\`notifiedAt\` IS NULL
    LIMIT 200
  `;
}

export async function markStockAlertNotified(db: SqlClient, id: string) {
  await db.$executeRaw`
    UPDATE \`StockAlert\` SET \`notifiedAt\` = NOW(3) WHERE \`id\` = ${id}
  `;
}

export async function deleteAllStockAlerts(db: SqlClient) {
  await db.$executeRaw`DELETE FROM \`StockAlert\``;
}
