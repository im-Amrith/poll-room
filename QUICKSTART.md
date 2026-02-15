# Quick Start Guide

Get Poll Room running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Firebase account (free)

## Steps

### 1. Install Dependencies (1 minute)

```bash
npm install
```

### 2. Set Up Firebase (2 minutes)

1. Create a project at [firebase.google.com](https://console.firebase.google.com)
2. Add a web app and copy the config
3. Create Firestore database in test mode
4. Go to Firestore → Rules
5. Copy and paste rules from `firestore.rules` and publish

### 3. Configure Environment (30 seconds)

Edit `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the App (30 seconds)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Test It Out (1 minute)

1. Create a poll with a question and 2+ options
2. You'll be redirected to the poll page
3. Open the same URL in another browser/tab
4. Vote in one window
5. Watch it update in real-time in the other! ✨

## Troubleshooting

**"Failed to create poll"**
- Check your `.env.local` file
- Verify Firebase credentials are correct
- Restart the dev server

**"Permission denied"**
- Make sure you've published the Firestore rules
- Check that Firestore is in test mode
- Verify rules in Firebase Console → Firestore → Rules

**Real-time not working**
- Firestore listeners work automatically
- Check browser console for errors
- Verify internet connection

## Next Steps

- Deploy to Vercel (see [README.md](README.md#deployment))
- Read [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for detailed Firebase setup
- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how it works
- Customize styles in [globals.css](app/globals.css)

Need more help? See [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for detailed instructions.
