# Componentes do Colmeia não acompanham proporcionalmente o tamanho de fonte definido no dispositivo (iOS e Android)

**Componente afetado:** Input Select (Colmeia Design System Web v3.3.0). Os demais componentes de texto provavelmente têm o mesmo comportamento.

## Ambiente

- iOS: [modelo / versão], Safari
- Android: [modelo / versão], Chrome
- Storybook: `web-static.sicredi.io/docs/@design-system/colmeia-design-system-web@3.3.0`, página *Inputs › Input Select › Docs*

## Passos para reproduzir

1. No dispositivo, alterar o tamanho da fonte do sistema:
   - iOS: Ajustes › Acessibilidade › Tela e Tamanho do Texto › Texto Maior;
   - Android: Configurações › Tela › Tamanho da fonte.
2. Abrir o Storybook do Colmeia no navegador nativo, na página do Input Select.
3. Comparar o texto do componente (label, valor selecionado e texto de suporte) com o tamanho de fonte normal e com o tamanho ampliado.
4. Repetir com o tamanho de fonte reduzido.

## Resultado esperado

O texto dos componentes acompanha a escala definida pelo usuário no sistema, na mesma proporção que o texto do restante do dispositivo, como já acontece em componentes nativos com Dynamic Type no iOS e escala de fonte no Android.

## Resultado obtido

O texto do componente muda de tamanho quando a fonte do sistema é alterada, mas em proporção bem menor que a configurada. Com a fonte ampliada, label, valor e texto de suporte ficam visivelmente menores que o texto do sistema. Com a fonte reduzida, também não acompanham. O comportamento se repete no iOS e no Android.

## Evidências

- `InputSelect_fontenormaliOS.png` / `InputSelect_fonteampliadaiOS.png`
- `InputSelect_fontenormalAndroid.png` / `InputSelect_fonteampliadaAndroid.png`
- `InputSelect_fontepequenaiOS.png` / `InputSelect_fontepequenaAndroid.png`

## Impacto

- **Acessibilidade:** usuários com baixa visão que dependem de fonte ampliada não recebem o aumento que configuraram. Isso fere o critério WCAG 2.1 **1.4.4 Redimensionar texto** (nível AA).
- **Consistência em jornadas híbridas:** em jornadas em WebView dentro do app, as telas web ficam com texto menor que as telas nativas vizinhas, o que gera uma experiência inconsistente para o mesmo usuário.

## Possível causa (a confirmar)

Os tokens de tipografia do Colmeia são definidos em valores fixos em `px` (por exemplo, `--font-size-xs: 16px`, `--font-size-2xs: 14px`). Valores em `px` não acompanham a preferência de fonte do usuário. A pequena variação observada vem provavelmente do ajuste automático do próprio navegador, e não do design system.

## Sugestão de correção (a avaliar pelo time do DS)

- Definir os tokens de fonte em `rem`, relativos ao tamanho de fonte raiz.
- No iOS, permitir que a fonte raiz siga o Dynamic Type, por exemplo com `font: -apple-system-body` no `html`.
- Em WebView, avaliar se o app nativo deve repassar a escala de fonte do sistema para a página.
