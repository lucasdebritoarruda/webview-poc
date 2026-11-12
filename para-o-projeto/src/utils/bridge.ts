/**
 * Ponte de comunicação Web <-> App nativo.
 *
 * Web -> nativo:
 *   iOS     : window.webkit.messageHandlers.colmeia.postMessage(obj)
 *   Android : window.ColmeiaAndroid.postMessage(jsonString)
 *
 * Nativo -> web:
 *   O app chama window.colmeiaReceive({ type, payload })
 *   e a página dispara o evento "colmeia:native".
 */

export interface BridgeMessage {
  type: string;
  payload?: unknown;
}

export type Channel = "ios" | "android" | "browser";

interface IosMessageHandler {
  postMessage: (message: unknown) => void;
}

interface AndroidBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    webkit?: { messageHandlers?: Partial<Record<string, IosMessageHandler>> };
    ColmeiaAndroid?: AndroidBridge;
    colmeiaReceive?: (message: BridgeMessage) => void;
  }
}

export const NATIVE_EVENT = "colmeia:native";

function iosHandler(): IosMessageHandler | undefined {
  return window.webkit?.messageHandlers?.colmeia;
}

export function bridgeChannel(): Channel {
  if (iosHandler() !== undefined) {
    return "ios";
  }
  if (window.ColmeiaAndroid !== undefined) {
    return "android";
  }
  return "browser";
}

export function sendToNative(message: BridgeMessage): Channel {
  const ios = iosHandler();
  if (ios !== undefined) {
    ios.postMessage(message);
    return "ios";
  }
  const android = window.ColmeiaAndroid;
  if (android !== undefined) {
    android.postMessage(JSON.stringify(message));
    return "android";
  }
  console.info("[bridge] sem app nativo, mensagem:", message);
  return "browser";
}

export function isBridgeMessage(value: unknown): value is BridgeMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

export function installNativeReceiver(): void {
  window.colmeiaReceive = (message: BridgeMessage): void => {
    window.dispatchEvent(new CustomEvent(NATIVE_EVENT, { detail: message }));
  };
}
