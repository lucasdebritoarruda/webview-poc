/**
 * Ponte de comunicação Web <-> App nativo.
 *
 * Web -> nativo:
 *   iOS     : window.webkit.messageHandlers.colmeia.postMessage(obj)
 *   Android : window.ColmeiaAndroid.postMessage(jsonString)
 *
 * Nativo -> web:
 *   O app chama window.colmeiaReceive({ type, payload })
 *   e a página recebe a mensagem pelos ouvintes de onNativeMessage().
 */

export interface BridgeMessage {
  payload?: unknown;
  type: string;
}

export type Channel = "ios" | "android" | "browser";

type NativeListener = (message: BridgeMessage) => void;

interface IosMessageHandler {
  postMessage: (message: unknown) => void;
}

interface AndroidBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ColmeiaAndroid?: AndroidBridge;
    colmeiaReceive?: (message: unknown) => void;
    webkit?: { messageHandlers?: Partial<Record<string, IosMessageHandler>> };
  }
}

const listeners = new Set<NativeListener>();

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
  return "browser";
}

function isBridgeMessage(value: unknown): value is BridgeMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

/** Registra um ouvinte para as mensagens do app. Retorna a função que o remove. */
export function onNativeMessage(listener: NativeListener): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}

export function installNativeReceiver(): void {
  window.colmeiaReceive = (message: unknown): void => {
    if (!isBridgeMessage(message)) {
      return;
    }
    listeners.forEach((listener): void => {
      listener(message);
    });
  };
}
