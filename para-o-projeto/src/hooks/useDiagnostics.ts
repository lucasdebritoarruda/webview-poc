import { useEffect, useState } from "react";
import { bridgeChannel } from "#/utils/bridge";

/**
 * Coleta, em tempo real, as informações do ambiente que mais impactam um
 * design system rodando dentro de WebView.
 */
export interface DiagnosticItem {
  label: string;
  value: string;
}

export type Diagnostics = readonly DiagnosticItem[];

const KEYBOARD_THRESHOLD_PX = 120;
const BRAND_TOKEN = "--action-primary-bg-color";

function detectHost(userAgent: string): string {
  const isIOS =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (isIOS) {
    // WKWebView não inclui "Safari/" no user agent; o Safari inclui.
    return userAgent.includes("Safari/") ? "iOS · Safari" : "iOS · WKWebView";
  }
  if (userAgent.includes("Android")) {
    // A WebView do Android marca "; wv)" no user agent.
    return userAgent.includes("; wv)") ? "Android · WebView" : "Android · Chrome";
  }
  return "Desktop / outro";
}

function readSafeArea(probe: HTMLElement | null): string {
  if (probe === null) {
    return "-";
  }
  const style = getComputedStyle(probe);
  return `top ${style.paddingTop} · bottom ${style.paddingBottom} · left ${style.paddingLeft} · right ${style.paddingRight}`;
}

function size(width: number, height: number): string {
  return `${String(Math.round(width))} × ${String(Math.round(height))}`;
}

function collect(probe: HTMLElement | null): Diagnostics {
  const { userAgent } = navigator;
  const visual = window.visualViewport;
  const rootFont = getComputedStyle(document.documentElement).fontSize;
  const token = getComputedStyle(document.body).getPropertyValue(BRAND_TOKEN).trim();
  const keyboardOpen =
    visual !== null && window.innerHeight - visual.height > KEYBOARD_THRESHOLD_PX;

  return [
    { label: "Ambiente", value: detectHost(userAgent) },
    { label: "Bridge nativa", value: bridgeChannel() },
    { label: "Tema (data-theme)", value: document.body.getAttribute("data-theme") ?? "-" },
    { label: `Token ${BRAND_TOKEN}`, value: token === "" ? "NÃO CARREGADO" : token },
    { label: "Viewport (layout)", value: size(window.innerWidth, window.innerHeight) },
    {
      label: "Viewport visível",
      value: visual === null ? "sem suporte" : size(visual.width, visual.height),
    },
    { label: "Teclado aberto?", value: keyboardOpen ? "provavelmente sim" : "não" },
    { label: "Safe area", value: readSafeArea(probe) },
    { label: "Device pixel ratio", value: String(window.devicePixelRatio) },
    { label: "Fonte raiz (zoom de texto)", value: rootFont },
    {
      label: "Esquema do sistema",
      value: matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro",
    },
    {
      label: "Reduzir movimento",
      value: matchMedia("(prefers-reduced-motion: reduce)").matches ? "sim" : "não",
    },
    { label: "Toque (maxTouchPoints)", value: String(navigator.maxTouchPoints) },
    { label: "Suporta 100dvh", value: CSS.supports("height", "100dvh") ? "sim" : "não" },
    { label: "Suporta :has()", value: CSS.supports("selector(:has(*))") ? "sim" : "não" },
    { label: "User agent", value: userAgent },
  ];
}

export function useDiagnostics(probe: HTMLElement | null): Diagnostics {
  const [data, setData] = useState<Diagnostics>([]);

  useEffect((): (() => void) => {
    const update = (): void => {
      setData(collect(probe));
    };
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });

    return (): void => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [probe]);

  return data;
}
