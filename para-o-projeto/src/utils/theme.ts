/**
 * Tema do Colmeia para a POC.
 *
 * O Colmeia troca as cores lendo os atributos data-brand e data-theme do <body>.
 * Nesta POC o tema fica fixo no modo claro, independente do sistema ou do app.
 * Para voltar a testar o modo escuro, troque THEME para "default-dark".
 */

const BRAND = "sicredi";
const THEME = "default-light";

export function applyLightTheme(): void {
  document.body.setAttribute("data-brand", BRAND);
  document.body.setAttribute("data-theme", THEME);
}
