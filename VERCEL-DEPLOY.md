# Deploy to Vercel

This guide will help you deploy Poll Room to Vercel.

## Prerequisites

1. ✅ Firebase project is set up and configured
2. ✅ Firestore database is created with security rules applied
3. ✅ App works locally (`npm run dev`)

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

#### A. Push to GitHub

1. Create a new GitHub repository
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit: Poll Room app"
git remote add origin https://github.com/YOUR_USERNAME/poll-room.git
git push -u origin main
```

#### B. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `poll-room` repository
5. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

#### C. Add Environment Variables

In the **Environment Variables** section, add these 6 variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**⚠️ Important**: Use the same values from your local `.env.local` file

6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment to complete
8. Click **"Visit"** to see your live app!

### 3. Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to add environment variables
```

## Post-Deployment

### Verify Deployment

1. Visit your Vercel URL (e.g., `https://poll-room.vercel.app`)
2. Create a test poll
3. Share the poll link and test voting
4. Check Firebase Console to verify data is being saved

### Update Firestore Security Rules (Optional)

If you want to restrict access to your Vercel domain only, update your Firestore rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all polls and related data
    match /polls/{pollId} {
      allow read: if true;
      allow create: if request.auth == null; // Allow anonymous creation
    }
    
    match /options/{optionId} {
      allow read: if true;
      allow create: if request.auth == null;
      // Only allow vote_count updates through transactions
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['vote_count'])
                    && request.resource.data.vote_count == resource.data.vote_count + 1;
    }
    
    match /votes/{voteId} {
      allow read: if true;
      allow create: if request.auth == null;
    }
  }
}
```

## Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Solution**: Make sure all dependencies are in `package.json`, run `npm install` locally

**Error**: "Environment variables not found"
- **Solution**: Add all 6 Firebase environment variables in Vercel Dashboard

### Runtime Errors

**Error**: "Firebase: Error (auth/invalid-api-key)"
- **Solution**: Double-check your `NEXT_PUBLIC_FIREBASE_API_KEY` in Vercel

**Error**: "Poll creation fails"
- **Solution**: Verify Firestore database exists and security rules are published

### Performance Issues

**Error**: `ERR_INSUFFICIENT_RESOURCES`
- **Solution**: This has been fixed by properly cleaning up real-time listeners

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed by Vercel
5. Wait for SSL certificate to be provisioned (~5 minutes)

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds and show deployment status

## Environment Variables Management

To update environment variables after deployment:

1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Edit or add variables
4. Click **"Save"**
5. **Redeploy** for changes to take effect

---

**Your app is now live! 🎉**

Share your Vercel URL with anyone to start collecting poll responses in real-time.
