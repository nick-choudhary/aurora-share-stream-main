# Deploy to Netlify

## One-Click Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/aurora-share-stream)

## Setup Instructions

1. Click the "Deploy to Netlify" button above and connect your GitHub repository
2. Netlify will automatically use the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA routing: redirects `/*` to `/index.html`
3. Configure Environment Variables in Netlify ? Site settings ? Environment variables:
   
   **Option A: With Rate Limiting (Recommended)**
   - `VITE_WEBHOOK_URL` = `/.netlify/functions/submit-comment`
   - `N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`
   
   **Option B: Direct Access (No Rate Limiting)**
   - `VITE_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`
   
4. Click "Deploy"

## Requirements

- A working n8n webhook endpoint that accepts POST requests
- The webhook should accept JSON data with the following structure:
  ```json
  {
    "comment_url": "https://linkedin.com/...",
    "id": "extracted-post-id"
  }
  ```

## Environment Variables

**Configuration Option 1: With Rate Limiting (Recommended)**

- `VITE_WEBHOOK_URL` = `/.netlify/functions/submit-comment`
  - The endpoint your frontend calls (rate-limited proxy)
  
- `N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`
  - Your actual n8n webhook URL (used by the proxy to forward requests)

**Configuration Option 2: Direct Access (No Rate Limiting)**

- `VITE_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`
  - Your n8n webhook URL (frontend calls it directly)

## Rate Limiting (Built-in Protection)

The app includes a rate-limited proxy function (`submit-comment.js`) that protects your webhook from abuse:

**Rate Limits:**
- **Per IP**: 5 requests per 5 minutes
- **Cooldown**: 30 seconds between consecutive requests
- **Global**: 100 requests per minute (burst protection)

**Benefits:**
- Prevents spam and abuse
- Protects your n8n instance from being overwhelmed
- User-friendly error messages with retry times
- No code changes required

**How it works:**
1. Frontend sends requests to `/.netlify/functions/submit-comment`
2. Function validates rate limits based on client IP address
3. If allowed, forwards request to the URL in `N8N_WEBHOOK_URL` (your actual n8n webhook)
4. Returns appropriate responses with retry information if rate-limited

**To enable:**
1. Deploy your app to Netlify (function is automatically deployed)
2. Set **two** environment variables in Netlify:
   - `VITE_WEBHOOK_URL=/.netlify/functions/submit-comment`
   - `N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/get-comments`
3. Trigger a redeploy
4. Done! Rate limiting is now active

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your webhook URL:
   ```bash
   # Option 1: Direct n8n webhook (no rate limiting)
   VITE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/get-comments
   
   # Option 2: Test Netlify function locally (requires netlify-cli)
   VITE_WEBHOOK_URL=/.netlify/functions/submit-comment
   ```
3. Run `npm install`
4. Run `npm run dev` (or `netlify dev` to test Netlify functions locally)

## Webhook Testing

The app supports configuring the webhook via:

- `.env` ? `VITE_WEBHOOK_URL`
- URL query ? `?webhook=...`
- In-app field ? saves to localStorage

**Note:** Rate limiting only works when using `/.netlify/functions/submit-comment`, not with direct webhook URLs.
