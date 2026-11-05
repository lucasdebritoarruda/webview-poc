// ColmeiaWebView.swift
// Shell mínimo em SwiftUI para abrir a página de teste do Colmeia num WKWebView.
// Uso: ColmeiaWebViewScreen(url: URL(string: "http://192.168.0.10:5173")!)
//
// Info.plist (só para testes com o servidor de desenvolvimento em HTTP):
//   NSAppTransportSecurity > NSAllowsLocalNetworking = YES

import SwiftUI
import WebKit

struct ColmeiaWebViewScreen: View {
    let url: URL
    @Environment(\.colorScheme) private var colorScheme
    @State private var lastMessage = "—"

    var body: some View {
        ColmeiaWebView(url: url, colorScheme: colorScheme) { message in
            lastMessage = message
        }
        // Deixa a web desenhar atrás do notch/home indicator;
        // a página trata isso com env(safe-area-inset-*).
        .ignoresSafeArea()
        .overlay(alignment: .top) {
            Text("Último msg web: \(lastMessage)")
                .font(.caption2)
                .padding(4)
                .background(.thinMaterial, in: Capsule())
                .padding(.top, 60)
        }
    }
}

struct ColmeiaWebView: UIViewRepresentable {
    let url: URL
    let colorScheme: ColorScheme
    let onMessage: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onMessage: onMessage) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // Ponte web -> nativo: window.webkit.messageHandlers.colmeia.postMessage(...)
        config.userContentController.add(context.coordinator, name: "colmeia")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isInspectable = true            // Safari > Desenvolvedor (iOS 16.4+)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false                // evita flash branco no modo escuro
        webView.backgroundColor = .clear
        context.coordinator.webView = webView

        // Envia o tema atual na URL para a página já abrir no modo certo
        var comps = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "theme", value: colorScheme == .dark ? "dark" : "light")]
        webView.load(URLRequest(url: comps.url!))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // Nativo -> web: avisa a página quando o modo do sistema muda
        let mode = colorScheme == .dark ? "dark" : "light"
        webView.evaluateJavaScript(
            "window.colmeiaReceive && window.colmeiaReceive({type:'setTheme', payload:'\(mode)'})"
        )
    }

    final class Coordinator: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?
        let onMessage: (String) -> Void
        init(onMessage: @escaping (String) -> Void) { self.onMessage = onMessage }

        func userContentController(_ controller: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            let body = message.body as? [String: Any]
            let type = body?["type"] as? String ?? "?"
            onMessage(type)

            // Responde o ping para validar o caminho de volta
            if type == "ping" {
                webView?.evaluateJavaScript(
                    "window.colmeiaReceive({type:'pong', payload:'iOS ok'})"
                )
            }
        }
    }
}
