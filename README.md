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

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/nick-choudhary/aurora-share-stream-main)

#### Deployment Steps:

1. **Connect Your Repository**
   - Click the button above and connect your GitHub repo
   - Netlify will auto-detect `npm run build` and `dist` via `netlify.toml`

2. **Configure Environment Variables**
   
   Go to: **Netlify Dashboard → Your Site → Site configuration → Environment variables**
   
   **Option A: With Rate Limiting (Recommended) ⭐**
   
   Add these 2 variables:
   - `VITE_WEBHOOK_URL` = `/.netlify/functions/submit-comment`
   - `N8N_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`
   
   **Option B: Direct Access (No Rate Limiting)**
   
   Add this 1 variable:
   - `VITE_WEBHOOK_URL` = `https://your-n8n-instance.com/webhook/get-comments`

3. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

**Important Notes:**
- Environment variables can be updated anytime in **Site configuration → Environment variables**
- After changing `VITE_WEBHOOK_URL`, trigger a redeploy for changes to take effect
- After changing `N8N_WEBHOOK_URL` (backend only), no redeploy needed - changes are instant!

### Environment Variables Reference

Configure these in: **Netlify Dashboard → Your Site → Site configuration → Environment variables**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_WEBHOOK_URL` | Yes | Frontend webhook endpoint | `/.netlify/functions/submit-comment` or `https://your-n8n.com/webhook` |
| `N8N_WEBHOOK_URL` | Only if using rate limiting | Your actual n8n webhook URL (backend) | `https://your-n8n-instance.com/webhook/get-comments` |

**Configuration Examples:**

**✅ Recommended: With Rate Limiting**
```
VITE_WEBHOOK_URL=/.netlify/functions/submit-comment
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/get-comments
```

**Alternative: Direct Access (No Protection)**
```
VITE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/get-comments
```

**💡 Tip:** You can change `N8N_WEBHOOK_URL` anytime without redeploying! Only `VITE_WEBHOOK_URL` changes require a redeploy.

## Custom domain

If you deploy on a host that supports custom domains (e.g., Netlify), follow their docs to connect a domain to your deployment.
