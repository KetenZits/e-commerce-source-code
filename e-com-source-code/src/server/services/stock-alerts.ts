import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifyChannel } from "@/server/services/notifications";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { markStockAlertNotified, pendingStockAlertsForVariant } from "@/server/services/stock-alert-store";

export async function notifyStockAlerts(variantId: string) {
  const alerts = await pendingStockAlertsForVariant(db, variantId);
  if (!alerts.length) return 0;

  const storefront = await getStorefrontConfig();
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const alert of alerts) {
    try {
      await notifyChannel("email", {
        event: "stock.back-in-stock",
        subject: `${alert.title} is back in stock`,
        text: `${alert.title} (${alert.sku}) is available again at ${storefront.siteName}. ${origin}/products/${alert.slug}`,
        data: { email: alert.email },
      });
      await markStockAlertNotified(db, alert.id);
      sent += 1;
    } catch (error) {
      logger.warn("Stock alert email failed", { id: alert.id, error: String(error) });
    }
  }

  return sent;
}
