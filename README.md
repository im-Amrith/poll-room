# 🗳️ Poll Room - Real-Time Polling Application

A modern, real-time polling application with a beautiful sunset gradient UI. Built with Next.js 16, Firebase Firestore, and Tailwind CSS. Create polls, share them via unique links, and watch results update in real-time with smooth animations across all connected clients.

![Live Demo](https://img.shields.io/badge/demo-live-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)

## ✨ Premium Features

### Core Features
- **Poll Creation**: Create polls with custom questions and multiple options (minimum 2)
- **Unique Sharing Links**: Each poll gets a unique URL for easy sharing
- **Real-Time Updates**: Vote counts update instantly across all viewers using Firestore real-time listeners
- **Anti-Abuse Protection**: Dual-layer voting protection with visible integrity badges
  - Client-side: localStorage tracking
  - Server-side: IP address hashing and validation
- **No Login Required**: Anyone with the link can vote
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎯 Advanced Features (Shortlist Differentiators)

1. **📊 Local Poll History**
   - Automatically saves all created polls to browser localStorage
   - "Your Recent Polls" section on homepage
   - No authentication required - simple and effective

2. **📱 Native Mobile Sharing**
   - Web Share API for native share experience on mobile
   - Automatic fallback to clipboard copy on desktop
   - Toast notifications for user feedback

3. **🎬 Animated Results**
   - Smooth bar chart animations using Framer Motion
   - Vote counts pulse when updated
   - Professional, polished real-time experience

4. **✅ Voter Integrity Indicators**
   - Visible badges showing anti-abuse checks passed
   - "Browser Check Passed" and "IP Check Passed" indicators
   - Transparent fairness system

5. **📲 QR Code Generation**
   - One-click QR code generation for instant sharing
   - Perfect for classrooms, meetings, or physical spaces
   - Smooth expand/collapse animations

**See [IMPROVEMENTS.md](IMPROVEMENTS.md) for detailed feature documentation.**

## 🎨 Design

Professional SaaS-level UI with a stunning sunset gradient color palette:
- Glassmorphism effects and layered gradients
- Smooth animations powered by Framer Motion
- Fully responsive design for mobile and desktop
- 3D button effects and micro-interactions
- Leader badges (⭐) and visual voting feedback

## Tech Stack

- **Frontend**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore (NoSQL)
- **Real-Time**: Firestore real-time listeners (onSnapshot)
- **Animations**: Framer Motion
- **QR Codes**: react-qr-code
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

## 🚀 How It Works

### Poll Creation
1. Enter a question and at least 2 options
2. System generates a unique URL for the poll
3. Poll data is saved to Firestore
4. Automatically added to your local poll history

### Real-Time Voting
1. User selects an option on the poll page
2. **Client-side check**: localStorage validates against duplicate votes
3. **Optimistic UI**: Vote count updates immediately with smooth animation
4. **Server-side validation**: IP address is hashed and verified in the `votes` collection
5. **Real-time sync**: All connected clients receive updates via Firestore listeners

### Anti-Abuse Protection

**Dual-Layer Security:**

- **Layer 1 - Client-Side**: localStorage tracking prevents accidental duplicate votes
- **Layer 2 - Server-Side**: IP address hashing (SHA-256) blocks malicious repeat voting

Both checks are visually indicated with integrity badges after voting.

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

## ⚡ Edge Cases & Error Handling

| Scenario | Solution |
|----------|----------|
| **Concurrent Voting** | Firestore transactions with atomic increments prevent race conditions |
| **Invalid Poll ID** | Custom 404 page with link to create new poll |
| **Network Failure** | Optimistic UI updates with automatic rollback on error |
| **Duplicate Voting** | 429 status returned + visual feedback showing "Already Voted" |
| **Shared IP Networks** | Note displayed that office/school WiFi may only allow one vote |

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy poll room application"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your poll-room repository
   - Click "Import"

3. **Configure Environment Variables**
   
   In the Vercel dashboard, add these 6 environment variables:
   
   | Variable | Source |
   |----------|--------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → General |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → General |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → General |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings → General |

4. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for the build to complete
   - Vercel will provide a production URL (e.g., `poll-room.vercel.app`)

5. **Auto-Deployment**
   - Every push to the main branch automatically triggers a new deployment
   - Preview deployments are created for pull requests

**Important**: Test your Firebase configuration locally before deploying. Make sure Firestore security rules are properly configured.

## 💡 Future Enhancements

- [ ] Poll expiration dates with countdown timer
- [ ] Optional poll visibility (public/private with password)
- [ ] Results export (CSV, PDF, PNG)
- [ ] Analytics dashboard with voting trends
- [ ] Custom color themes and branding
- [ ] Multi-choice voting (select multiple options)
- [ ] Live comment section per poll
- [ ] Poll categories and public discovery page
- [ ] Email notifications for poll creators
- [ ] AI-powered poll suggestions

## 📝 License

MIT License - Feel free to use this project for learning or production!

## 👨‍💻 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using Next.js, Firebase, and modern web technologies.**
