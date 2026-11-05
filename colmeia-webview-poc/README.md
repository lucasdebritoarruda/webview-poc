# POC: Colmeia Design System em WebView (iOS e Android)

Página de teste que usa os componentes reais do Colmeia (v3.3.0) para validar se
o design system funciona bem dentro de jornadas embarcadas em WebView.

## O que a página tem

A jornada segue as telas do canvas **POC Colmeia em WebView**: 3 etapas, com o
cabeçalho mostrando o progresso, o botão voltar e o fechar (X).

| Etapa / elemento | O que valida |
|---|---|
| **1 · Início e diagnóstico** | Alert e painel que detecta WKWebView ou Android WebView, mede viewport, teclado, safe areas, zoom de texto, tema e se os tokens CSS carregaram |
| **2 · Formulário** | Teclado virtual, máscaras (CPF, celular, moeda), Input Date, Select nativo, Radio, Checkbox, Switch e o **Drawer com campo** |
| **3 · Conclusão** | Toast, Currency, Flag, List Navigation, log de eventos; **Concluir** abre o **Modal** de confirmação |
| **Header Product** | Progresso, voltar (na etapa 1 fecha a WebView), fechar (X), distância do notch |
| **Fixed Bar** | Botão fixo embaixo, acima do home indicator e do teclado |
| **Bridge** | Web → nativo (`ping`, `close`, `finish`) e nativo → web (`setTheme`, `pong`) |

## 1. Pré-requisitos

- Node 22 ou superior e pnpm (`npm i -g pnpm`)
- Acesso ao registro npm interno do Sicredi (os pacotes `@design-system/*` são privados).
  Copie `.npmrc.example` para `.npmrc` e preencha com o endereço e o token.

## 2. Rodar no navegador

```bash
pnpm install
pnpm dev
```

O terminal mostra dois endereços: `Local` (para o navegador do Mac) e `Network`
(ex.: `http://192.168.0.10:5173`, para o celular na mesma rede Wi-Fi).

## 3. Rodar dentro do app

- **iOS**: crie um app SwiftUI, adicione `native/ios/ColmeiaWebView.swift` e use
  `ColmeiaWebViewScreen(url: URL(string: "http://SEU-IP:5173")!)`.
  No simulador, `http://localhost:5173` também funciona.
  Inspecione pelo Safari > Desenvolvedor > [simulador/aparelho].
- **Android**: crie um app (Empty Activity), substitua a `MainActivity` por
  `native/android/MainActivity.kt` e ajuste o Manifest como indicado no topo do arquivo.
  No emulador o Mac é `http://10.0.2.2:5173`. Inspecione em `chrome://inspect`.

## 4. Roteiro de testes (marque em cada plataforma)

| # | Teste | iOS | Android |
|---|---|---|---|
| 1 | "Token --color-brand-primary" aparece com valor (não "NÃO CARREGADO") | | |
| 2 | Fonte da marca e ícones carregam corretamente | | |
| 3 | Header não fica atrás do notch / Dynamic Island | | |
| 4 | Botão "Continuar" fica acima do home indicator / barra de gestos | | |
| 5 | Ao focar CPF/celular/valor, abre teclado adequado e máscara funciona | | |
| 6 | Com teclado aberto, o campo focado continua visível | | |
| 7 | Select "Estado" abre o seletor nativo | | |
| 8 | Input Date abre o calendário e permite escolher a data | | |
| 9 | Modal: overlay cobre a tela toda e o fundo não rola | | |
| 10 | Drawer: abre, fecha arrastando/tocando fora e o teclado não cobre o campo | | |
| 11 | Toasts aparecem em posição visível (não atrás de barras) | | |
| 12 | Modo escuro: troca pelo Switch e pelo sistema, sem flash branco | | |
| 13 | Zoom de texto do sistema (Android) não quebra o layout | | |
| 14 | Rotação para paisagem mantém layout e safe areas laterais | | |
| 15 | "Enviar ping ao app" recebe "pong" no log | | |
| 16 | Voltar na etapa 1 e o X do cabeçalho fecham a WebView (`close`) | | |
| 17 | "Copiar diagnóstico" funciona (clipboard) | | |
| 18 | Leitor de tela (VoiceOver / TalkBack) lê rótulos dos campos e botões | | |
| 19 | Rolagem fluida, sem travamentos ao abrir/fechar componentes | | |
| 20 | Tempo de carregamento aceitável em rede 4G | | |

## 5. Gerar versão para hospedar

```bash
pnpm build      # gera a pasta dist/
pnpm preview    # serve o build para testar
```

## Pontos a confirmar com o time do Colmeia

- **Toast**: o Storybook usa `CdsToastBasicImpl.positive(...)`. Confirme se esse é o
  nome exportado pelo pacote. Se não for, ajuste o import em `src/App.tsx`.
- **Tailwind**: o projeto inclui Tailwind 4 porque o Colmeia é construído sobre ele.
  Se o time disser que não é necessário no consumidor, remova `@import "tailwindcss"`
  do `index.css` e o plugin do `vite.config.ts`.
- **Assinatura dos `onChange`**: os handlers aceitam evento ou valor direto. Se algum
  log mostrar `[object Object]`, ajuste o helper `valueOf` em `App.tsx`.
