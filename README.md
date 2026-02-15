# Poll Room - Real-Time Polling Application

A modern, real-time polling application built with Next.js, Firebase, and Tailwind CSS. Create polls, share them via unique links, and watch results update in real-time across all connected clients.

## Features

- **Poll Creation**: Create polls with custom questions and multiple options (minimum 2)
- **Unique Sharing Links**: Each poll gets a unique URL for easy sharing
- **Real-Time Updates**: Vote counts update instantly across all viewers using Firestore real-time listeners
- **Anti-Abuse Protection**: Dual-layer voting protection:
  - Client-side: localStorage tracking
  - Server-side: IP address hashing and validation
- **No Login Required**: Anyone with the link can vote
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Database Persistence**: All data persists in Firebase Firestore
- **Atomic Operations**: Race condition-proof vote counting with Firestore transactions

## Tech Stack

- **Frontend**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore (NoSQL)
- **Real-Time**: Firestore real-time listeners (onSnapshot)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase account (free Spark plan works perfectly)

### 1. Clone and Install

\`\`\`bash
cd poll-room
npm install
\`\`\`

### 2. Set Up Firebase

1. Create a new project at [firebase.google.com](https://firebase.google.com)
2. Go to **Project Settings** → **General**
3. Scroll to "Your apps" and click the **Web icon** (</>) to add a web app
4. Register your app with a nickname (e.g., "Poll Room")
5. Copy the Firebase configuration object
6. Go to **Firestore Database** in the left sidebar
7. Click **Create database**
8. Choose **Start in test mode** (we'll add security rules next)
9. Select a location close to you
10. Go to **Firestore Database** → **Rules** tab
11. Copy and paste the contents of `firestore.rules` and publish

### 3. Configure Environment Variables

1. Update the `.env.local` file with your Firebase credentials:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

2. Find these values in your Firebase console:
   - Go to **Project Settings** → **General**
   - Scroll to "Your apps" → Select your web app
   - Copy each value from the Firebase configuration object

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Poll Creation Flow

1. User enters a question and at least 2 options
2. System validates input and generates a unique document ID for the poll
3. Poll and options are saved to Firestore
4. User is redirected to `/poll/[id]`

### Voting Flow

1. User opens poll link and sees current results
2. User selects an option
3. **Client-side check**: localStorage is checked for previous votes
4. **Optimistic UI**: Vote count increments immediately
5. **Server-side validation**:
   - IP address is hashed and checked against the `votes` collection
   - If IP already voted, request is rejected with 429 status
   - If valid, vote is recorded and count is incremented using Firestore transaction
6. **Real-time broadcast**: All connected clients receive the update via Firestore listeners

### Anti-Abuse Mechanisms

#### Mechanism 1: Client-Side Persistence (Convenience Check)
- Stores `voted_poll_[id]` in localStorage
- Provides instant feedback
- Can be bypassed by clearing cache or using incognito mode

#### Mechanism 2: Server-Side IP Tracking (Hard Check)
- Hashes IP address using SHA-256 for privacy
- Stores in `votes` collection with poll_id
- Prevents voting even if localStorage is cleared
- Edge case: Shared networks (office WiFi) may be blocked after first vote

### Real-Time Synchronization

- Uses Firestore real-time listeners (onSnapshot)
- Listens for changes on the `options` collection
- Automatically updates vote counts for all connected clients
- No polling or manual refresh required

## Project Structure

\`\`\`
poll-room/
├── app/
│   ├── api/
│   │   └── vote/
│   │       └── [pollId]/
│   │           └── route.ts          # Vote submission API endpoint
│   ├── poll/
│   │   └── [id]/
│   │       └── page.tsx              # Poll viewing/voting page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page (poll creation)
│   └── globals.css                   # Global styles
├── lib/
│   ├── firebase.ts                   # Firebase client & types
│   └── utils.ts                      # Helper functions
├── firestore.rules                   # Firestore security rules
├── .env.local                        # Environment variables
└── package.json
\`\`\`

## Firestore Collections

### polls (collection)
- `id` (Document ID - auto-generated)
- `question` (string)
- `created_at` (timestamp)

### options (collection)
- `id` (Document ID - auto-generated)
- `poll_id` (string - reference to poll document)
- `option_text` (string)
- `vote_count` (number, default: 0)
- `created_at` (timestamp)

### votes (collection - Anti-Abuse)
- `id` (Document ID - auto-generated)
- `poll_id` (string - reference to poll document)
- `ip_hash` (string) - SHA-256 hashed IP
- `device_id` (string) - Client-generated UUID
- `created_at` (timestamp)

## Edge Cases Handled

### Concurrent Voting
- Uses Firestore transactions with atomic increment
- Prevents race conditions where votes could be lost
- Firestore: `transaction.update(optionRef, { vote_count: increment(1) })`

### Invalid Poll ID
- Returns custom 404 page with helpful message
- Provides link to create a new poll

### Network Failure
- Implements optimistic UI updates
- Reverts changes if server request fails
- Shows appropriate error message to user

### Duplicate Voting
- Client-side: Disables voting buttons after voting
- Server-side: Returns 429 status if IP already voted
- User sees "You have already voted" message

## Deployment

### Deploy to Vercel

**📖 See [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) for detailed deployment instructions.**

Quick steps:

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add all 6 Firebase environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Install dependencies
- Build the Next.js application
- Deploy to a global CDN
- Provide a production URL
- Auto-deploy on every push to main branch

**Important**: Make sure your Firebase configuration works locally before deploying.

## Future Enhancements

- Poll expiration dates
- Optional poll visibility (public/private)
- Results export to CSV
- Poll analytics dashboard
- Custom poll themes
- Multi-choice voting (select multiple options)
- Comment section per poll
- Poll categories and discovery page

## License

MIT License - Feel free to use this project for learning or production!

## Author

Built as a demonstration of modern web application architecture with real-time capabilities.

---

**Note**: Make sure to set up Firestore database and apply the security rules from `firestore.rules` before running the application!
