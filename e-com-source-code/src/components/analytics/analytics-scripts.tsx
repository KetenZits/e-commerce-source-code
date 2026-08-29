"use client";

import { useEffect, useState } from "react";
import { readConsent } from "@/lib/consent";

function plausibleDomain() {
  return process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";
}

function gaId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
}

export function AnalyticsScripts() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(Boolean(readConsent()?.analytics));
    sync();
    window.addEventListener("store-cookie-consent", sync);
    return () => window.removeEventListener("store-cookie-consent", sync);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const nodes: HTMLElement[] = [];
    const plausible = plausibleDomain();
    const ga = gaId();

    if (plausible) {
      const script = document.createElement("script");
      script.defer = true;
      script.dataset.domain = plausible;
      script.src = "https://plausible.io/js/script.js";
      document.head.appendChild(script);
      nodes.push(script);
    }

    if (ga) {
      const loader = document.createElement("script");
      loader.async = true;
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
      const inline = document.createElement("script");
      inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`;
      document.head.appendChild(loader);
      document.head.appendChild(inline);
      nodes.push(loader, inline);
    }

    return () => {
      for (const node of nodes) node.remove();
    };
  }, [allowed]);

  return null;
}
