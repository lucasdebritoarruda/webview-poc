/**
 * Controle de tema do Colmeia.
 *
 * O Colmeia troca cores lendo os atributos data-brand e data-theme do <body>.
 * Ordem de prioridade do modo (claro/escuro):
 *   1. Parâmetro na URL, enviado pelo app nativo:  ?theme=dark
 *   2. Mensagem do app nativo:  window.colmeiaReceive({ type: "setTheme", payload: "dark" })
 *   3. Preferência do sistema (prefers-color-scheme)
 */

export type Mode = "light" | "dark";
const THEME_NAME = "default"; // troque para "diana" se importar o tema Diana

export function applyMode(mode: Mode) {
  document.body.setAttribute("data-brand", "sicredi");
  document.body.setAttribute("data-theme", `${THEME_NAME}-${mode}`);
}

export function initialMode(): Mode {
  const fromUrl = new URLSearchParams(location.search).get("theme");
  if (fromUrl === "dark" || fromUrl === "light") return fromUrl;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Segue a preferência do sistema enquanto o app nativo não forçar um modo. */
export function followSystemMode(onChange: (m: Mode) => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) =>
    onChange(e.matches ? "dark" : "light");
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
