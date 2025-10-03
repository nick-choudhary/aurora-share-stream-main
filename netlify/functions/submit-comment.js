/**
 * Netlify Function: submit-comment
 * Rate-limited proxy for LinkedIn comment submissions to n8n webhook
 *
 * Rate Limits:
 * - Per IP: 5 requests per 5 minutes
 * - Cooldown: 30 seconds between consecutive requests
 * - Global: 100 requests per minute
 *
 * Usage: POST /.netlify/functions/submit-comment
 * Body: { comment_url: string, id: string }
 */

const RATE_LIMIT_PER_IP = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_MS = 30 * 1000; // 30 seconds
const GLOBAL_LIMIT = 100;
const GLOBAL_WINDOW_MS = 60 * 1000; // 1 minute
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// In-memory storage (resets on function cold start)
const ipRequestMap = new Map(); // { ip: [timestamps] }
const ipLastRequestMap = new Map(); // { ip: timestamp }
let globalRequestTimestamps = [];

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

function getClientIp(event) {
  // Netlify provides client IP in headers
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0] ||
    event.headers["client-ip"] ||
    "unknown"
  );
}

function cleanupOldTimestamps(timestamps, windowMs) {
  const now = Date.now();
  return timestamps.filter((ts) => now - ts < windowMs);
}

function checkRateLimit(ip) {
  const now = Date.now();

  // Check cooldown period
  const lastRequest = ipLastRequestMap.get(ip);
  if (lastRequest && now - lastRequest < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil(
      (COOLDOWN_MS - (now - lastRequest)) / 1000
    );
    return {
      allowed: false,
      reason: "cooldown",
      retryAfter: remainingSeconds,
      message: `Please wait ${remainingSeconds} seconds before submitting again.`,
    };
  }

  // Check per-IP rate limit
  let ipTimestamps = ipRequestMap.get(ip) || [];
  ipTimestamps = cleanupOldTimestamps(ipTimestamps, RATE_LIMIT_WINDOW_MS);

  if (ipTimestamps.length >= RATE_LIMIT_PER_IP) {
    const oldestTimestamp = Math.min(...ipTimestamps);
    const retryAfter = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)) / 1000
    );
    return {
      allowed: false,
      reason: "rate_limit",
      retryAfter,
      message: `Rate limit exceeded. You can submit ${RATE_LIMIT_PER_IP} requests per 5 minutes. Please try again in ${retryAfter} seconds.`,
    };
  }

  // Check global rate limit
  globalRequestTimestamps = cleanupOldTimestamps(
    globalRequestTimestamps,
    GLOBAL_WINDOW_MS
  );

  if (globalRequestTimestamps.length >= GLOBAL_LIMIT) {
    return {
      allowed: false,
      reason: "global_limit",
      retryAfter: 60,
      message:
        "Service is experiencing high traffic. Please try again in a moment.",
    };
  }

  // Update counters
  ipTimestamps.push(now);
  ipRequestMap.set(ip, ipTimestamps);
  ipLastRequestMap.set(ip, now);
  globalRequestTimestamps.push(now);

  return { allowed: true };
}

async function forwardToWebhook(webhookUrl, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("Failed to parse webhook response:", parseError);
      data = { message: "Response received but could not be parsed" };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Webhook request timed out");
    }
    throw error;
  }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  const clientIp = getClientIp(event);
  console.log(`Request from IP: ${clientIp}`);

  // Check rate limit
  const rateLimitCheck = checkRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    console.log(
      `Rate limit exceeded for IP: ${clientIp} - ${rateLimitCheck.reason}`
    );
    return jsonResponse(429, {
      success: false,
      message: rateLimitCheck.message,
      retryAfter: rateLimitCheck.retryAfter,
      reason: rateLimitCheck.reason,
    });
  }

  // Parse request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  const { comment_url, id } = requestBody;

  // Validate required fields
  if (!comment_url || !id) {
    return jsonResponse(400, {
      success: false,
      message: "Missing required fields: comment_url and id",
    });
  }

  // Validate URL format
  try {
    new URL(comment_url);
  } catch (error) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid comment_url format",
    });
  }

  // Get the actual n8n webhook URL from environment
  // This should be your direct n8n webhook URL, NOT the proxy URL
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("N8N_WEBHOOK_URL not configured in Netlify environment variables");
    return jsonResponse(500, {
      success: false,
      message:
        "Backend webhook endpoint not configured. Please contact the administrator.",
    });
  }

  // Forward to actual webhook
  try {
    console.log(`Forwarding request to webhook: ${webhookUrl}`);
    const webhookResponse = await forwardToWebhook(webhookUrl, {
      comment_url,
      id,
      client_ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(webhookResponse.status, {
      success: webhookResponse.ok,
      message:
        webhookResponse.data.message ||
        (webhookResponse.ok
          ? "Request processed successfully"
          : "Request failed"),
      data: webhookResponse.data.data || webhookResponse.data,
    });
  } catch (error) {
    console.error("Error forwarding to webhook:", error);
    return jsonResponse(502, {
      success: false,
      message: error.message || "Failed to connect to webhook service",
    });
  }
};
