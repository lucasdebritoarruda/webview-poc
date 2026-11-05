/**
 * Ponte de comunicação Web <-> App nativo.
 *
 * Web -> nativo:
 *   iOS     : window.webkit.messageHandlers.colmeia.postMessage(obj)
 *             (registrado no WKUserContentController com o nome "colmeia")
 *   Android : window.ColmeiaAndroid.postMessage(jsonString)
 *             (registrado com addJavascriptInterface(obj, "ColmeiaAndroid"))
 *
 * Nativo -> web:
 *   O app chama   window.colmeiaReceive({ type, payload })
 *   e a página dispara o evento "colmeia:native" para quem estiver ouvindo.
 */

export type BridgeMessage = { type: string; payload?: unknown };
export type Channel = "ios" | "android" | "browser";

type W = Window & {
  webkit?: { messageHandlers?: Record<string, { postMessage(m: unknown): void }> };
  ColmeiaAndroid?: { postMessage(m: string): void };
  colmeiaReceive?: (m: BridgeMessage) => void;
};
const w = window as W;

export function bridgeChannel(): Channel {
  if (w.webkit?.messageHandlers?.colmeia) return "ios";
  if (w.ColmeiaAndroid?.postMessage) return "android";
  return "browser";
}

export function sendToNative(msg: BridgeMessage): Channel {
  const channel = bridgeChannel();
  if (channel === "ios") w.webkit!.messageHandlers!.colmeia.postMessage(msg);
  else if (channel === "android") w.ColmeiaAndroid!.postMessage(JSON.stringify(msg));
  else console.info("[bridge] sem app nativo, mensagem:", msg);
  return channel;
}

export function installNativeReceiver() {
  w.colmeiaReceive = (m: BridgeMessage) => {
    window.dispatchEvent(new CustomEvent("colmeia:native", { detail: m }));
  };
}
