/**
 * Netlify Function: check-webhook
 * Validates that the webhook configuration is reachable.
 * Usage: /.netlify/functions/check-webhook
 * 
 * Checks the actual backend webhook (N8N_WEBHOOK_URL) not the frontend URL
 */

const DEFAULT_TIMEOUT_MS = 5000;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }

  try {
    // Check the actual backend webhook URL (not the proxy)
    // Priority: N8N_WEBHOOK_URL > VITE_WEBHOOK_URL (for backward compatibility)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    const viteWebhookUrl = process.env.VITE_WEBHOOK_URL;
    
    let targetUrl;
    let usingProxy = false;
    let configSource;

    if (n8nWebhookUrl) {
      // Using rate-limited proxy - check the backend n8n webhook
      targetUrl = n8nWebhookUrl.trim();
      usingProxy = true;
      configSource = "N8N_WEBHOOK_URL";
    } else if (viteWebhookUrl && !viteWebhookUrl.startsWith("/.netlify")) {
      // Using direct webhook (not proxy)
      targetUrl = viteWebhookUrl.trim();
      configSource = "VITE_WEBHOOK_URL";
    } else if (viteWebhookUrl && viteWebhookUrl.startsWith("/.netlify")) {
      // Frontend is configured to use proxy, but N8N_WEBHOOK_URL is missing
      return jsonResponse(400, { 
        ok: false, 
        message: "Rate limiting enabled but N8N_WEBHOOK_URL not configured. Please set your actual n8n webhook URL in N8N_WEBHOOK_URL environment variable." 
      });
    } else {
      return jsonResponse(400, { 
        ok: false, 
        message: "No webhook URL configured. Set N8N_WEBHOOK_URL or VITE_WEBHOOK_URL in environment variables." 
      });
    }

    if (!targetUrl) {
      return jsonResponse(400, { ok: false, message: "Webhook URL is empty" });
    }

    try {
      new URL(targetUrl);
    } catch {
      return jsonResponse(400, { ok: false, message: "Invalid URL format" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    // 1) Try OPTIONS
    try {
      const res = await fetch(targetUrl, {
        method: "OPTIONS",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        return jsonResponse(200, {
          ok: true,
          method: "OPTIONS",
          status: res.status,
          usingProxy,
          configSource,
        });
      }
    } catch (err) {
      // fall through to POST
    }

    // 2) Try POST minimal test
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: true,
          id: "netlify-healthcheck",
          comment_url: "https://example.test",
        }),
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      if (res.status < 500) {
        return jsonResponse(200, {
          ok: true,
          method: "POST",
          status: res.status,
          usingProxy,
          configSource,
        });
      }
      return jsonResponse(502, {
        ok: false,
        message: "Webhook responded with server error",
        status: res.status,
        configSource,
      });
    } catch (error) {
      clearTimeout(timeout2);
      return jsonResponse(504, {
        ok: false,
        message: "Cannot reach webhook",
        error: error.message,
        configSource,
      });
    }
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      message: "Internal error",
      error: error.message,
    });
  }
};
