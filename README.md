# Aurora Share Stream

## Project info

Share your LinkedIn comment link to receive an exclusive resource.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Features

- **Beautiful Aurora-themed UI** - Custom Northern Lights design with smooth animations
- **Built-in Rate Limiting** - Protect your webhook with automatic rate limits (5 req/5min per IP, 30s cooldown)
- **Form Validation** - Real-time validation for LinkedIn comment URLs
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Mode Support** - Automatic theme switching
- **Error Handling** - User-friendly error messages and retry guidance

## How can I deploy this project?

### Quick Deploy to Netlify

Option A: One-click deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/nick-choudhary/aurora-share-stream-main)

1. Click the button above and connect your GitHub repo
2. Netlify will auto-detect `npm run build` and `dist` via `netlify.toml`
3. Set environment variables in Netlify → Site settings → Environment variables:
   - `VITE_WEBHOOK_URL` = your n8n webhook URL (e.g., `https://your-n8n-instance.com/webhook/get-comments`)
4. Deploy

After first deploy, remember to set/update `VITE_WEBHOOK_URL` in Netlify and then trigger a redeploy so the new value is applied to both the frontend and the Netlify Function.

Option B: Manual

1. Fork this repository
2. In Netlify, create a new site from Git, pick your fork
3. Build command: `npm run build`; Publish directory: `dist`
4. Add `VITE_WEBHOOK_URL` as an environment variable
5. Deploy

Important: Any change to `VITE_WEBHOOK_URL` requires triggering a new deploy in Netlify.

### Environment Variables Required

**Option 1: With Rate Limiting (Recommended)**
- `VITE_WEBHOOK_URL` = `/.netlify/functions/submit-comment`
- `N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`

**Option 2: Direct Access (No Rate Limiting)**
- `VITE_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`

**Note:** For best security, use Option 1 with the built-in rate-limited proxy. Set both environment variables in Netlify, then redeploy.

## Custom domain

If you deploy on a host that supports custom domains (e.g., Netlify), follow their docs to connect a domain to your deployment.
