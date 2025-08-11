/**
 * Netlify Function: check-webhook
 * Validates that the provided webhook URL is reachable.
 * Usage: /.netlify/functions/check-webhook?url=https://example.com/webhook
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
    const urlParam =
      (event.queryStringParameters && event.queryStringParameters.url) || "";
    const envUrl =
      process.env.WEBHOOK_URL || process.env.VITE_WEBHOOK_URL || "";
    const targetUrl = urlParam.trim() || envUrl.trim();

    if (!targetUrl) {
      return jsonResponse(400, { ok: false, message: "Missing webhook URL" });
    }

    try {
      new URL(targetUrl);
    } catch {
      return jsonResponse(400, { ok: false, message: "Invalid URL" });
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
        });
      }
      return jsonResponse(502, {
        ok: false,
        message: "Webhook responded with server error",
        status: res.status,
      });
    } catch (error) {
      clearTimeout(timeout2);
      return jsonResponse(504, {
        ok: false,
        message: "Cannot reach webhook",
        error: error.message,
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
