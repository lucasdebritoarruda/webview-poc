// MainActivity.kt
// Shell mínimo Android para abrir a página de teste do Colmeia numa WebView.
//
// AndroidManifest.xml:
//   <uses-permission android:name="android.permission.INTERNET" />
//   <application android:usesCleartextTraffic="true" ...>   (só para teste em HTTP)
//   <activity android:windowSoftInputMode="adjustResize" ...> (teclado redimensiona a WebView)
//
// Emulador: o Mac fica em http://10.0.2.2:5173

package com.exemplo.colmeiapoc

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private val baseUrl = "http://10.0.2.2:5173"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge() // desenha atrás das barras do sistema

        WebView.setWebContentsDebuggingEnabled(true) // chrome://inspect
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()
            // Ponte web -> nativo: window.ColmeiaAndroid.postMessage(json)
            addJavascriptInterface(Bridge(), "ColmeiaAndroid")
        }
        setContentView(webView)
        webView.loadUrl("$baseUrl/?theme=${currentMode()}")
    }

    // Nativo -> web: avisa a página quando o modo do sistema muda
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        sendToWeb("setTheme", currentMode())
    }

    private fun currentMode(): String {
        val night = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return if (night == Configuration.UI_MODE_NIGHT_YES) "dark" else "light"
    }

    private fun sendToWeb(type: String, payload: String) {
        webView.post {
            webView.evaluateJavascript(
                "window.colmeiaReceive && window.colmeiaReceive({type:'$type', payload:'$payload'})",
                null
            )
        }
    }

    inner class Bridge {
        @JavascriptInterface
        fun postMessage(json: String) {
            val type = JSONObject(json).optString("type")
            runOnUiThread {
                Toast.makeText(this@MainActivity, "Web: $type", Toast.LENGTH_SHORT).show()
            }
            if (type == "ping") sendToWeb("pong", "Android ok")
            if (type == "close") runOnUiThread { finish() }
        }
    }
}
