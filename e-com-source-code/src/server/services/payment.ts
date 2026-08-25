import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { env } from "@/lib/env";
import { getPaymentConfig } from "@/lib/payment-config";
import { satangToBaht } from "@/lib/money";

export async function promptPayQr(amountCents: number, promptpayId?: string) {
  const id = promptpayId || (await getPaymentConfig()).promptpayId;
  const payload = generatePayload(id, { amount: satangToBaht(amountCents) });
  const dataUrl = await QRCode.toDataURL(payload, {
    margin: 1,
    color: { dark: "#2C3B32", light: "#FFFFFF" },
    width: 280,
  });
  return { payload, dataUrl };
}

export type SlipResult = {
  ok: boolean;
  uncertain: boolean;
  amountSatang?: number;
  raw?: unknown;
};

export async function verifySlip(opts: {
  slipImageUrl?: string | null;
  expectedAmountCents: number;
}): Promise<SlipResult> {
  const config = await getPaymentConfig();
  if (config.paymentMode === "demo") {
    return { ok: true, uncertain: false, amountSatang: opts.expectedAmountCents, raw: { mode: "demo" } };
  }

  if (env.SLIPOK_API_KEY && opts.slipImageUrl) {
    try {
      const form = new FormData();
      form.set("url", opts.slipImageUrl);
      form.set("amount", String(satangToBaht(opts.expectedAmountCents)));
      const res = await fetch(`https://api.slipok.com/api/line/apikey/${env.SLIPOK_API_KEY}`, {
        method: "POST",
        body: form,
      });
      const raw = await res.json();
      if (!res.ok) return { ok: false, uncertain: true, raw };
      return { ok: Boolean(raw?.success), uncertain: !raw?.success, raw };
    } catch (error) {
      return { ok: false, uncertain: true, raw: { error: String(error) } };
    }
  }

  if (env.EASYSLIP_API_KEY && opts.slipImageUrl) {
    try {
      const res = await fetch("https://developer.easyslip.com/api/v1/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EASYSLIP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: opts.slipImageUrl }),
      });
      const raw = await res.json();
      if (!res.ok) return { ok: false, uncertain: true, raw };
      return { ok: Boolean(raw?.data), uncertain: !raw?.data, raw };
    } catch (error) {
      return { ok: false, uncertain: true, raw: { error: String(error) } };
    }
  }

  return { ok: false, uncertain: true, raw: { reason: "No slip verifier configured" } };
}
