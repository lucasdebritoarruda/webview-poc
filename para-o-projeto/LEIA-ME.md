# Arquivos da POC corrigidos para o lint

Copie cada arquivo para o MESMO caminho no projeto `engineering-samples-plat-web-ds-webview`,
substituindo o que já existe:

| Arquivo desta pasta | Vai para (no projeto) |
|---|---|
| `src/pages/PocWebView/index.tsx` | `src/pages/PocWebView/index.tsx` |
| `src/hooks/useDiagnostics.ts` | `src/hooks/useDiagnostics.ts` |
| `src/utils/bridge.ts` | `src/utils/bridge.ts` |
| `src/utils/theme.ts` | `src/utils/theme.ts` |

Depois:

1. Apague `src/styles/webview.css` do projeto, se ainda existir (o projeto só aceita Tailwind).
2. O `src/routes/routes.tsx` não muda: a rota `poc-webview` continua apontando para `#/pages/PocWebView`.
3. Rode o lint e o projeto:
   ```bash
   pnpm lint
   pnpm dev
   ```

## O que mudou em relação à versão anterior

- Sem `any`: os eventos dos componentes são lidos com funções seguras (`readValue`, `readChecked`...).
- Toda função declara o tipo de retorno.
- Números viraram constantes com nome (`TOAST_SHORT_MS`, `MAX_LOG_LINES`...).
- Eventos usam só funções com nome `handle...`, sem arrow function inline.
- As etapas agora são `"start" | "form" | "finish"` em vez de `1 | 2 | 3`.
- Tema fixo no modo claro (`theme.ts` ficou com uma única função, `applyLightTheme`).
- O switch "Modo escuro (forçar)" saiu, porque o tema está fixo.
- Alert e Flag com `CDSAlertHeading`/`CDSAlertDescription` e `CDSFlagHeading`/`CDSFlagDescription`.
- Estilos só com classes Tailwind (sem `webview.css`).
- A ponte nativa (`bridge.ts`) declara os tipos do `window` em vez de forçar com `as`.
