# Deploy to Netlify

## One-Click Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/aurora-share-stream)

## Setup Instructions

1. Click the "Deploy to Netlify" button above and connect your GitHub repository
2. Netlify will automatically use the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA routing: redirects `/*` to `/index.html`
3. Configure Environment Variables in Netlify → Site settings → Environment variables:
   - `VITE_WEBHOOK_URL`: Your n8n webhook URL (e.g., `https://your-n8n-instance.com/webhook/get-comments`)
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

- `VITE_WEBHOOK_URL` (required): Your n8n webhook URL for processing LinkedIn comments

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your webhook URL
3. Run `npm install`
4. Run `npm run dev`

## Webhook Testing

The app supports configuring the webhook via:

- `.env` → `VITE_WEBHOOK_URL`
- URL query → `?webhook=...`
- In-app field → saves to localStorage
