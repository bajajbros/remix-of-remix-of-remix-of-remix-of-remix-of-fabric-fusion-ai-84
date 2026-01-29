# Netlify Deployment Guide

## Quick Deploy

### Option 1: Deploy via Git (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider
   - Select your repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Set Environment Variables**
   - In Netlify dashboard, go to: Site settings → Environment variables
   - Add these variables:
     ```
     VITE_SUPABASE_PROJECT_ID=nyozmlwpttctnmljzmdu
     VITE_SUPABASE_URL=https://nyozmlwpttctnmljzmdu.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3ptbHdwdHRjdG5tbGp6bWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjQ2MjgsImV4cCI6MjA4NDk0MDYyOH0.MQhAiOd-C4bE4dZdQKYBYpNIe31RHUv4nvpSw6dr47E
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3ptbHdwdHRjdG5tbGp6bWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjQ2MjgsImV4cCI6MjA4NDk0MDYyOH0.MQhAiOd-C4bE4dZdQKYBYpNIe31RHUv4nvpSw6dr47E
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your site automatically

### Option 2: Manual Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Option 3: Drag and Drop Deploy

1. **Build the project locally**
   ```bash
   npm run build
   ```

2. **Drag and drop the `dist` folder** to [Netlify Drop](https://app.netlify.com/drop)

3. **Set environment variables** in Netlify dashboard as mentioned above

## Custom Domain Setup

1. Go to: Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain name
4. Follow Netlify's instructions to update your DNS records

### DNS Configuration

**Option A: Use Netlify DNS (Recommended)**
- Point your domain's nameservers to Netlify's nameservers
- Netlify will manage all DNS records

**Option B: External DNS**
- Add an A record pointing to Netlify's load balancer: `75.2.60.5`
- Or add a CNAME record for `www` subdomain pointing to: `<your-site>.netlify.app`

## Automatic Deployments

Once connected via Git, Netlify will automatically deploy:
- Every push to your main branch → Production
- Pull requests → Deploy previews

## Build Settings (Already configured in netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify Node version compatibility
- Check build logs in Netlify dashboard

### 404 on Page Refresh
- Already handled via `_redirects` file and `netlify.toml`
- Ensures all routes redirect to `index.html` for SPA routing

### Environment Variables Not Working
- Make sure variable names start with `VITE_`
- Redeploy after adding environment variables
- Check for typos in variable names

## Support

For issues, check:
- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Community Forum](https://answers.netlify.com)
