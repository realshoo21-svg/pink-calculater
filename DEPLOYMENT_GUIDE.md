# 🚀 Deployment Guide - Scientific Master Calculator

Complete guide to deploy your Scientific Calculator PWA to production.

## Table of Contents
1. [Local Testing](#local-testing)
2. [Vercel Deployment](#vercel-deployment)
3. [Netlify Deployment](#netlify-deployment)
4. [GitHub Pages](#github-pages)
5. [Firebase Hosting](#firebase-hosting)
6. [Traditional Hosting](#traditional-hosting)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Local Testing

Before deploying, test locally to ensure everything works.

### Using Python (Built-in)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

### Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Start server
http-server

# Or using npx (no install needed)
npx http-server
```

Then open: `http://localhost:8080`

### Using Node.js Built-in (v18+)
```bash
node --run serve
# Opens on http://localhost:3000
```

### Testing PWA Features
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" loaded
4. Check "Service Worker" registered
5. Test offline mode:
   - Go to Network tab
   - Select "Offline" checkbox
   - Refresh page - should still work!

---

## Vercel Deployment (Recommended)

**Best for**: Production PWA hosting

### Step 1: Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub, GitLab, or Email

### Step 2: Prepare Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Scientific Calculator PWA"

# Create new repository on GitHub and push
git remote add origin https://github.com/yourusername/scientific-calculator
git push -u origin main
```

### Step 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Select "GitHub" and authorize
3. Select your repository
4. Framework preset: Leave as "Other"
5. Click "Deploy"

### Step 4: Auto Deployment
- Every push to main branch auto-deploys
- Get a unique URL for each deployment
- Production URL after first deploy

### Vercel CLI Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Vercel Custom Domain
1. Go to project settings
2. Add custom domain
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (auto-issued)

---

## Netlify Deployment

**Best for**: Easy one-click deployment

### Step 1: Create Netlify Account
- Go to https://netlify.com
- Sign up with GitHub/GitLab/Bitbucket

### Step 2: Deploy via Drag & Drop
```bash
# Build output (already ready)
# Just drag the project folder to Netlify
```

1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag entire project folder
4. Wait for deployment

### Step 3: Deploy via Git
1. Connect GitHub repository
2. Select branch (main)
3. Netlify auto-builds and deploys
4. Done!

### Netlify CLI Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Netlify Custom Domain
1. Domain settings
2. Add custom domain
3. Update nameservers or DNS records
4. SSL auto-enabled

---

## GitHub Pages

**Best for**: Free hosting (with limitations)

### Step 1: Create Repository
```bash
# On GitHub, create new repository
# Name: yourusername.github.io

# Or for project repository
# Name: scientific-calculator
```

### Step 2: Push Code
```bash
git remote add origin https://github.com/yourusername/scientific-calculator
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages"
3. Select source: `main` branch, `/ (root)`
4. Save
5. Wait ~5 minutes

### Step 4: Access Your Site
- **User/Organization pages**: https://yourusername.github.io
- **Project pages**: https://yourusername.github.io/scientific-calculator

### GitHub Pages Limitations
- No serverless functions
- Must use HTTPS
- Limited to static files
- No build process needed (perfect for our PWA!)

---

## Firebase Hosting

**Best for**: Google ecosystem, real-time database

### Step 1: Set Up Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create new project
firebase init hosting
```

### Step 2: Configure firebase.json
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [{"key": "Cache-Control", "value": "max-age=3600"}]
      }
    ],
    "redirects": [
      {
        "source": "**",
        "destination": "/index.html",
        "type": 200
      }
    ]
  }
}
```

### Step 3: Deploy
```bash
firebase deploy --only hosting

# Or to specific channel
firebase hosting:channel:deploy preview-channel
```

### Step 4: Custom Domain
1. Go to Firebase Console
2. Hosting → Connect Domain
3. Add custom domain
4. Verify ownership via DNS
5. SSL auto-enabled

---

## Traditional Hosting

**Best for**: Full control, existing hosting

### Step 1: Prepare Files
```
scientific-calculator/
├── index.html
├── styles.css
├── script.js
├── service-worker.js
├── manifest.json
├── .htaccess
└── README.md
```

### Step 2: Upload Files
Using FTP/SFTP:
```bash
# Using FileZilla or similar
1. Connect to FTP server
2. Upload all files
3. Set permissions (usually 644 for files)
```

Or using SSH:
```bash
scp -r ./* user@yourserver.com:/public_html/calculator/
```

### Step 3: Configure Server

#### Apache (.htaccess already included)
- File should be in root directory
- Ensure `mod_rewrite` is enabled

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/html/calculator;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /service-worker.js {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

#### Enable HTTPS
- Use Let's Encrypt (free)
- Or purchase SSL certificate
- Ensure all content served over HTTPS

### Step 4: Verify Installation
1. Visit https://yourdomain.com/calculator
2. Open DevTools → Application
3. Verify Service Worker registered
4. Verify Manifest loaded
5. Test offline mode

---

## Post-Deployment Checklist

### Before Going Live
- [ ] Test on mobile devices
- [ ] Test in offline mode
- [ ] Verify all functions work
- [ ] Check console for errors
- [ ] Test on different browsers
- [ ] Verify history saves
- [ ] Test all themes
- [ ] Verify PWA install prompt
- [ ] Check loading speed
- [ ] Test keyboard shortcuts

### Security Checks
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] No console errors
- [ ] No sensitive data exposed
- [ ] Service Worker working
- [ ] Manifest valid

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] First load < 2 seconds
- [ ] Offline load works
- [ ] No unused code
- [ ] Images optimized
- [ ] Code minified

### SEO & Indexing
- [ ] Meta tags present
- [ ] Favicon set
- [ ] robots.txt configured
- [ ] sitemap.xml created
- [ ] Open Graph tags
- [ ] Submit to search engines

### Analytics Setup
Optional but recommended:
```html
<!-- Add to index.html before </body> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

---

## Deployment Comparison

| Platform | Cost | Ease | Speed | Features |
|----------|------|------|-------|----------|
| **Vercel** | Free/Paid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Excellent |
| **Netlify** | Free/Paid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Great |
| **GitHub Pages** | Free | ⭐⭐⭐⭐ | ⭐⭐⭐ | Limited |
| **Firebase** | Free/Paid | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Excellent |
| **Traditional** | Paid | ⭐⭐⭐ | ⭐⭐⭐ | Full Control |

---

## Troubleshooting Deployment

### Service Worker Not Registering
```
✅ Solution: Ensure HTTPS is enabled
✅ Solution: Check manifest.json syntax
✅ Solution: Clear browser cache
```

### manifest.json Returns 404
```
✅ Solution: Verify file exists in root
✅ Solution: Check HTML link tag points correctly
✅ Solution: Verify server MIME type configuration
```

### App Won't Install on Mobile
```
✅ Solution: Ensure HTTPS
✅ Solution: Valid manifest.json
✅ Solution: Minimum 3 icons
✅ Solution: Service Worker working
```

### Performance Issues
```
✅ Solution: Enable compression on server
✅ Solution: Set Cache-Control headers
✅ Solution: Use CDN for static files
✅ Solution: Check Network tab for slow files
```

### 404 Errors on Refresh
```
✅ Solution: Configure server rewrite rules
✅ Solution: For SPA, route all to index.html
✅ Solution: Use platforms like Vercel/Netlify
```

---

## Monitoring After Deployment

### Uptime Monitoring
- Use UptimeRobot (free)
- Monitor every 5 minutes
- Get alerts if down

### Error Tracking
- Use Sentry (free tier)
- Catch JavaScript errors
- Track user issues

### Analytics
- Google Analytics
- Mixpanel (optional)
- Track usage patterns

### Performance Monitoring
- Lighthouse CI
- WebPageTest
- Google PageSpeed Insights

---

## Updating After Deployment

### Simple Update
1. Make changes to files
2. Commit and push to Git
3. Platform auto-deploys (usually 1-2 mins)

### Clear Cache
Users might see cached version:
```javascript
// Service Worker automatically handles updates
// But users can force refresh: Ctrl+Shift+R (Windows)
// Or: Cmd+Shift+R (Mac)
```

### Version Update
```javascript
// Update cache version in service-worker.js
const CACHE_NAME = 'scientific-calculator-v2';
```

---

## Getting Help

- **Vercel Support**: https://vercel.com/support
- **Netlify Support**: https://support.netlify.com
- **Firebase Support**: https://firebase.google.com/support
- **MDN PWA**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

---

## Next Steps

1. Choose your deployment platform
2. Follow the specific guide above
3. Test thoroughly
4. Monitor performance
5. Gather user feedback
6. Plan improvements

---

**✨ Happy Deploying! ❤️**

Developed with Love by Shoo ❤️
