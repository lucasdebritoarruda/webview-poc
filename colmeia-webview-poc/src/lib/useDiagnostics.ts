import { useEffect, useState } from "react";
import { bridgeChannel } from "./bridge";

/**
 * Coleta, em tempo real, as informações do ambiente que mais impactam um
 * design system rodando dentro de WebView.
 */
export type Diagnostics = Record<string, string>;

function detectHost(ua: string): string {
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  if (isIOS) {
    // WKWebView não inclui "Safari/" no user agent; o Safari inclui.
    return /Safari\//.test(ua) ? "iOS · Safari" : "iOS · WKWebView";
  }
  if (isAndroid) {
    // WebView do Android marca "; wv)" no user agent.
    return /; wv\)/.test(ua) ? "Android · WebView" : "Android · Chrome";
  }
  return "Desktop / outro";
}

function readSafeArea(probe: HTMLElement | null): string {
  if (!probe) return "-";
  const s = getComputedStyle(probe);
  return `top ${s.paddingTop} · bottom ${s.paddingBottom} · left ${s.paddingLeft} · right ${s.paddingRight}`;
}

function collect(probe: HTMLElement | null, theme: string): Diagnostics {
  const ua = navigator.userAgent;
  const vv = window.visualViewport;
  const rootFont = getComputedStyle(document.documentElement).fontSize;
  const tokenProbe = getComputedStyle(document.body).getPropertyValue("--color-brand-primary").trim();

  return {
    Ambiente: detectHost(ua),
    "Bridge nativa": bridgeChannel(),
    "Tema (data-theme)": theme,
    "Token --color-brand-primary": tokenProbe || "NÃO CARREGADO",
    "Viewport (layout)": `${window.innerWidth} × ${window.innerHeight}`,
    "Viewport visível": vv ? `${Math.round(vv.width)} × ${Math.round(vv.height)}` : "sem suporte",
    "Teclado aberto?": vv && window.innerHeight - vv.height > 120 ? "provavelmente sim" : "não",
    "Safe area": readSafeArea(probe),
    "Device pixel ratio": String(window.devicePixelRatio),
    "Fonte raiz (zoom de texto)": rootFont,
    "Esquema do sistema": matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro",
    "Reduzir movimento": matchMedia("(prefers-reduced-motion: reduce)").matches ? "sim" : "não",
    "Toque (maxTouchPoints)": String(navigator.maxTouchPoints),
    "Suporta 100dvh": CSS.supports("height", "100dvh") ? "sim" : "não",
    "Suporta :has()": CSS.supports("selector(:has(*))") ? "sim" : "não",
    "User agent": ua,
  };
}

export function useDiagnostics(probe: HTMLElement | null) {
  const [data, setData] = useState<Diagnostics>({});

  useEffect(() => {
    const update = () =>
      setData(collect(probe, document.body.getAttribute("data-theme") ?? "-"));
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    // Atualiza quando o tema muda
    const obs = new MutationObserver(update);
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      obs.disconnect();
    };
  }, [probe]);

  return data;
}
