# Vercel Deployment Guide

Deploy Poll Room to production in under 5 minutes!

## Prerequisites

- ✅ Firebase project set up (see [FIREBASE-SETUP.md](FIREBASE-SETUP.md))
- ✅ GitHub account
- ✅ Code pushed to GitHub repository

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Poll Room application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/poll-room.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? **poll-room**
- In which directory? **.**
- Override settings? **N**

## Step 3: Add Environment Variables

### In Vercel Dashboard:

1. Go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

| Key | Value | Comments |
|-----|-------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your API key | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project ID | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID | From Firebase console |

4. Click **"Save"**
5. Click **"Redeploy"** in the Deployments tab

### Using Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste your Firebase API key when prompted

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Paste your auth domain when prompted

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Paste your project ID when prompted

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# Paste your storage bucket when prompted

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# Paste your sender ID when prompted

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
# Paste your app ID when prompted
```

Then redeploy:
```bash
vercel --prod
```

## Step 4: Configure Firebase for Production

In your Firebase console:

1. **Update Firestore Rules** (if moving from test mode):
   - Go to **Firestore Database** → **Rules**
   - Apply production rules from `firestore.rules`
   - Click **Publish**

2. **Add Authorized Domains**:
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your Vercel domain: `your-project-name.vercel.app`
   - Add your custom domain if you have one

3. **Monitor Usage**:
   - Go to **Usage and billing** → **Details**
   - Set up budget alerts if needed

## Step 5: Test Your Deployment

1. Visit your production URL (e.g., `https://poll-room.vercel.app`)
2. Create a test poll
3. Share the link
4. Open in multiple browsers/devices
5. Verify real-time updates work
6. Test voting restrictions

## Vercel Deployment Features

✅ **Automatic Deployments**
- Every push to `main` triggers a new deployment
- Preview deployments for pull requests

✅ **Global CDN**
- Your app is distributed worldwide
- Fast page loads from any location

✅ **Serverless Functions**
- API routes auto-scale
- No server management needed

✅ **Automatic HTTPS**
- Free SSL certificates
- Secure by default

✅ **Environment Variables**
- Securely stored
- Available at build and runtime

## Custom Domain (Optional)

### Add a Custom Domain

1. Go to project settings
2. Click **"Domains"**
3. Add your domain (e.g., `pollroom.com`)
4. Update DNS records as instructed
5. Wait for verification (5-30 minutes)

### Recommended DNS Setup

For `pollroom.com`:
```
Type: A
Name: @
Value: 76.76.21.21
```

For `www.pollroom.com`:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Monitoring & Analytics

### Vercel Analytics

Enable analytics to track:
- Page views
- Performance metrics
- Core Web Vitals
- Real User Monitoring (RUM)

In your project:
1. Click **"Analytics"**
2. Enable analytics
3. View real-time data

### Vercel Logs

View function logs:
1. Click **"Deployments"**
2. Select a deployment
3. Click **"Functions"**
4. View logs for each API route

### Firebase Monitoring

Monitor Firestore:
1. Firebase Console → **"Usage and billing"**
2. View document reads/writes
3. Monitor storage usage
4. Check for errors in **"Firestore"** → **"Usage"** tab

## Performance Optimization

### 1. Enable Edge Caching

In `next.config.ts`:
```typescript
const nextConfig = {
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
```

### 2. Optimize Images

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image src="/logo.png" width={200} height={100} alt="Logo" />
```

### 3. Enable Compression

Vercel automatically:
- Gzips responses
- Minifies CSS/JS
- Optimizes images

## Troubleshooting

### Build Failures

**Error**: `Module not found: Can't resolve '@/lib/supabase'`
- **Fix**: Make sure all files are committed to git
- Run `git status` and commit missing files

**Error**: `Environment variable not found`
- **Fix**: Add missing env vars in Vercel dashboard
- Redeploy after adding

### Runtime Errors

**Error**: "Failed to create poll"
- **Check**: Environment variables in Vercel
- **Verify**: Firebase credentials are correct
- **View**: Function logs in Vercel dashboard

**Error**: "Permission denied" from Firestore
- **Check**: Firestore security rules are published
- **Verify**: Rules allow public read/write
- **Test**: Use Firestore Rules Simulator in Firebase Console

### Deployment Issues

**Problem**: Changes not reflected
- **Solution**: Hard refresh (Ctrl+F5)
- Check build logs in Vercel
- Ensure correct branch is deployed

**Problem**: Slow initial load
- **Cause**: Cold start (first request after inactivity)
- **Normal**: Subsequent requests are fast
- **Upgrade**: Pro plan for faster cold starts

## Environment-Specific Configuration

### Development
```bash
npm run dev
# Uses .env.local
```

### Preview (PR deployments)
```bash
# Vercel creates preview URL automatically
# Uses Vercel environment variables
```

### Production
```bash
# Deploys from main branch
# Uses production environment variables
```

## Security Best Practices

1. ✅ Never commit `.env.local` to git
2. ✅ Use environment variables for secrets  
3. ✅ Update Firestore rules for production
4. ✅ Enable Firebase App Check for additional security
5. ✅ Monitor Firebase usage for suspicious activity
6. ✅ Set up Firebase budget alerts

## Scaling Considerations

### Free Tier Limits (Vercel)
- 100 GB bandwidth/month
- 100 hours serverless function execution
- Unlimited deployments

### Free Tier Limits (Firebase)
- 1 GB Firestore storage
- 50,000 document reads/day
- 20,000 document writes/day
- 10 GB/month bandwidth

### When to Upgrade

Upgrade if you exceed:
- ✅ 10,000+ monthly active users
- ✅ 1 million+ monthly votes
- ✅ 100+ polls/day creation rate

## Rollback Strategy

### Instant Rollback

1. Go to **"Deployments"**
2. Find previous working deployment
3. Click "..." → **"Promote to Production"**
4. Changes take effect immediately

### Git-Based Rollback

```bash
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

## CI/CD Pipeline

Vercel automatically:
1. ✅ Detects push to GitHub
2. ✅ Installs dependencies
3. ✅ Runs TypeScript checks
4. ✅ Builds Next.js app
5. ✅ Deploys to CDN
6. ✅ Sends deployment notification

Total time: ~2 minutes

## Post-Deployment Checklist

- [ ] Production URL accessible
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Poll creation works
- [ ] Voting works
- [ ] Real-time updates work
- [ ] Anti-abuse mechanisms active
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Supabase billing limits reviewed

## Useful Commands

```bash
# View deployment logs
vercel logs [deployment-url]

# List deployments
vercel ls

# Open dashboard
vercel open

# Get deployment URL
vercel inspect [deployment-url]

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Discord**: [vercel.com/discord](https://vercel.com/discord)
- **Firebase Support**: [firebase.google.com/support](https://firebase.google.com/support)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## Quick Deploy Button

Add this to your README.md for one-click deploy:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/poll-room&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

Congratulations! 🎉 Your Poll Room is now live and accessible worldwide!
