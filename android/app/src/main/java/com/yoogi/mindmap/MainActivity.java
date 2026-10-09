package com.yoogi.mindmap;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static String pendingDeepLink = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        checkAndDispatchDeepLink();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri != null && "com.yoogi.mindmap".equals(uri.getScheme())) {
            pendingDeepLink = uri.toString();
            checkAndDispatchDeepLink();
        }
    }

    private void checkAndDispatchDeepLink() {
        if (pendingDeepLink != null && getBridge() != null && getBridge().getWebView() != null) {
            final String link = pendingDeepLink;
            pendingDeepLink = null;
            WebView webView = getBridge().getWebView();
            webView.post(() -> {
                String safeLink = link.replace("'", "\\'");
                String js = "if (window.handleDeepLink) { window.handleDeepLink('" + safeLink + "'); } " +
                            "else { window.__pendingDeepLink = '" + safeLink + "'; } " +
                            "window.dispatchEvent(new CustomEvent('appDeepLink', { detail: '" + safeLink + "' }));";
                webView.evaluateJavascript(js, null);
            });
        }
    }

    public class AndroidAuthBridge {
        @JavascriptInterface
        public void openSystemBrowser(String url) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public String getPendingDeepLink() {
            String link = pendingDeepLink;
            pendingDeepLink = null;
            return link;
        }
    }

    @Override
    protected void load() {
        super.load();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidAuthBridge(), "AndroidAuth");
            getBridge().getWebView().postDelayed(this::checkAndDispatchDeepLink, 1000);
            getBridge().getWebView().postDelayed(this::checkAndDispatchDeepLink, 2500);
        }
    }
}
