# Firebase Setup Guide for Poll Room

This guide will walk you through setting up Firebase for the Poll Room application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project details:
   - **Project name**: poll-room (or any name you prefer)
   - **Enable Google Analytics**: Optional (you can disable for this demo)
4. Click **"Create project"**
5. Wait for the project to be created (~30 seconds)
6. Click **"Continue"**

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>)  in the center of the page
2. Register app:
   - **App nickname**: Poll Room
   - **Firebase Hosting**: Leave unchecked (we'll use Vercel)
3. Click **"Register app"**
4. **Copy the Firebase configuration** - you'll need this later!

It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "poll-room-xxxxx.firebaseapp.com",
  projectId: "poll-room-xxxxx",
  storageBucket: "poll-room-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

5. Click **"Continue to console"**

## Step 3: Set Up Firestore Database

### Create the Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose location:
   - **Start mode**: Select **"Start in test mode"** (we'll add security rules next)
   - **Location**: Choose the region closest to your users (e.g., us-central, europe-west)
4. Click **"Enable"**
5. Wait for Firestore to be provisioned (~1 minute)

### Apply Security Rules

1. Go to **"Firestore Database"** → **"Rules"** tab
2. Delete the default rules
3. Copy the contents from `firestore.rules` in your project:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Polls collection - public read, anyone can create
    match /polls/{pollId} {
      allow read: if true;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }
    
    // Options collection - public read, auto-created with polls
    match /options/{optionId} {
      allow read: if true;
      allow create: if true;
      // Only allow updating vote_count field
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['vote_count']);
      allow delete: if false;
    }
    
    // Votes collection - for anti-abuse tracking
    match /votes/{voteId} {
      allow read: if true;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

4. Click **"Publish"**
5. You should see "Your rules have been published"

## Step 4: Configure Environment Variables

1. Open `.env.local` in your project root
2. Update with your Firebase configuration values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=poll-room-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=poll-room-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=poll-room-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

3. Save the file

⚠️ **Important**: While these values are public (they're in the browser), security is enforced by Firestore Rules!

## Step 5: Verify Firestore Setup

Let's make sure everything is configured correctly:

1. Go to **Firestore Database** → **Data** tab
2. You should see an empty database (no collections yet)
3. This is normal - collections will be created automatically when you create your first poll

### Expected Collections (after first use):

**polls**:
- Document fields: question (string), created_at (timestamp)

**options**:
- Document fields: poll_id (string), option_text (string), vote_count (number), created_at (timestamp)

**votes**:
- Document fields: poll_id (string), ip_hash (string), device_id (string), created_at (timestamp)

## Step 6: Test Your Setup

1. Run the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Create a test poll:
   - Question: "What's your favorite framework?"
   - Options: "Next.js", "React", "Vue"

4. Click "Create Poll"

5. Go to **Firebase Console** → **Firestore Database** → **Data**

6. You should now see:
   - ✅ `polls` collection with 1 document
   - ✅ `options` collection with 3 documents

7. Try voting on an option

8. Refresh the Firestore database - you should see:
   - ✅ `votes` collection with 1 document
   - ✅ Updated `vote_count` in the option document

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"

**Solution**: 
- Check that you've published the Firestore rules
- Make sure rules allow public read/write as shown above
- Verify you're in "test mode" (rules end with `if true`)

### Issue: "Firebase app hasn't been configured"

**Solution**:
- Double-check all environment variables in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env.local`

### Issue: Environment variables undefined

**Solution**:
- Ensure all variables start with `NEXT_PUBLIC_`
- Restart your development server (`Ctrl+C` then `npm run dev`)
- Check for typos in variable names

### Issue: Real-time updates not working

**Solution**:
- Firestore real-time listeners work automatically
- Check browser console for errors
- Verify your internet connection
- Make sure you're not blocking WebSockets

## Security Best Practices

### For Development (Current Setup)

✅ Test mode rules allow development without authentication  
✅ Security rules prevent deletion of data  
✅ IP hashing provides basic abuse prevention

### For Production (Recommended Updates)

1. **Add rate limiting** to prevent spam:
```javascript
// In firestore.rules
match /votes/{voteId} {
  allow create: if request.time > resource.data.created_at + duration.value(1, 'm');
}
```

2. **Add data validation**:
```javascript
match /polls/{pollId} {
  allow create: if request.resource.data.question is string 
    && request.resource.data.question.size() > 0 
    && request.resource.data.question.size() < 500;
}
```

3. **Monitor usage** in Firebase Console → Usage tab

## Firestore Pricing (Free Tier)

Firebase Spark Plan (Free) includes:
- ✅ 1 GB stored data
- ✅ 50,000 document reads/day
- ✅ 20,000 document writes/day
- ✅ 20,000 document deletes/day
- ✅ 10 GB/month network egress

**Estimated capacity for Poll Room:**
- ~200,000+ polls before hitting storage limit
- ~10,000-50,000 votes per day (well within free tier)

## Monitoring & Debugging

### View Firestore Data

1. Go to **Firestore Database** → **Data**
2. Click on a collection to browse documents
3. Click on a document to see its fields

### Check Security Rules

1. Go to **Firestore Database** → **Rules**
2. Click **"Simulator"** to test rules
3. Try different operations (read, write, etc.)

### Monitor Usage

1. Go to **Usage and billing** → **Usage**
2. View document reads/writes
3. Monitor data storage

### View Logs

1. Go to **Firestore Database** → **Usage** tab
2. See request statistics
3. Monitor for errors or unusual patterns

## Next Steps

- ✅ Firebase configured
- ✅ Firestore database created
- ✅ Security rules applied
- ✅ Environment variables set
- ✅ Test poll created

You're ready to deploy! See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment instructions.

## Support Resources

- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Firestore Guide**: [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)
- **Stack Overflow**: Tag questions with `firebase` and `firestore`
- **Firebase Discord**: [discord.gg/firebase](https://discord.gg/firebase)

---

Congratulations! 🎉 Your Firebase setup is complete and Poll Room is ready to use!
