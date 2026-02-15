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

This application implements a two-tier fairness system to prevent vote manipulation while maintaining user privacy.

#### 🛡️ Layer 1: Client-Side Detection (Browser Fingerprinting)

**Implementation:**
- Generates a unique device ID using `nanoid()` on first visit
- Stores device ID in browser's localStorage
- Checks localStorage for `voted_poll_[pollId]` before allowing votes
- After voting, stores the poll ID in localStorage to prevent re-voting

**Purpose:**
- **User Experience**: Provides instant feedback without server round-trip
- **Convenience Protection**: Prevents accidental duplicate votes from the same browser

**Code Location:** `lib/utils.ts` → `hasVotedOnPoll()`, `markPollAsVoted()`

**Limitations:**
- Can be bypassed by clearing browser data
- Incognito/private browsing creates a new "device"
- Different browsers on the same device are treated as separate devices

**When it triggers:**
- User tries to vote twice from the same browser session
- User refreshes page after voting (vote button remains disabled)

---

#### 🔒 Layer 2: Server-Side IP Verification (Hard Enforcement)

**Implementation:**
- Extracts user's IP address from request headers (`x-forwarded-for` or `x-real-ip`)
- Hashes IP using SHA-256 for privacy (never stores raw IPs)
- Queries `votes` collection in Firestore for `poll_id` + `ip_hash` combination
- Creates a new vote record if not found, returns 429 error if duplicate detected
- Uses Firestore transactions to atomically increment vote count

**Purpose:**
- **Security**: Hard stop against malicious voting attempts
- **Privacy**: IP hashing ensures user anonymity while maintaining integrity
- **Fairness**: Ensures one vote per IP address, regardless of browser tricks

**Code Location:** `app/api/vote/[pollId]/route.ts` → POST handler

**Data Flow:**
```
1. User clicks vote → Client sends POST /api/vote/[pollId]
2. Server extracts IP → Hashes with SHA-256
3. Check Firestore: WHERE poll_id == X AND ip_hash == Y
4. If exists → Return 429 "Already voted"
5. If new → Create vote record + increment option.vote_count
6. Return success → Client shows integrity badges
```

**Limitations:**
- **Shared Networks**: Users behind the same NAT/proxy (office WiFi, school, public WiFi) share an IP
  - Only the first person can vote
  - Subsequent users from the same network will be blocked
- **Dynamic IPs**: Users with changing IPs (mobile data, VPN switching) might vote multiple times
- **VPN Bypass**: Sophisticated users can change VPN servers to get new IPs

**Trade-offs Made:**
- Chose IP-based tracking over authentication to maintain "no login required" UX
- Accepted shared network limitation as acceptable for most poll use cases
- Privacy-first approach (hashing) over raw IP logging

---

#### 📊 Visual Transparency

After voting, users see two integrity badges:
- ✅ **Browser Check Passed** - localStorage validation succeeded
- ✅ **IP Check Passed** - Server verified no duplicate from this IP

This builds trust by showing the security measures in action.

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

| Scenario | How It's Handled | Implementation Details |
|----------|------------------|------------------------|
| **Concurrent Voting** | Firestore transactions with atomic increments | Uses `runTransaction()` with `increment(1)` to prevent race conditions where simultaneous votes could result in incorrect counts |
| **Invalid Poll ID** | Custom 404 error page | Checks if poll exists in Firestore. If not found or ID is malformed, shows friendly error with "Create New Poll" button |
| **Network Failure** | Optimistic UI with rollback | Vote count increments immediately (optimistic update). If API fails, reverts count and displays error toast |
| **Duplicate Voting (Same Browser)** | localStorage check blocks UI | Vote buttons disabled instantly if `voted_poll_[id]` exists in localStorage. User sees "Already Voted" badge |
| **Duplicate Voting (Different Browser)** | Server returns 429 status | IP hash check on server. Returns HTTP 429 with error message. Client displays "You've already voted" warning |
| **Shared IP Networks** | Graceful limitation notice | First user votes successfully. Second user blocked by IP check. UI explains: "This may happen on shared networks like office WiFi" |
| **Missing Environment Variables** | Firebase initialization failure | App shows error message asking user to configure `.env.local` file. Returns 500 on API calls with helpful error |
| **Empty Poll Options** | Client-side validation | Minimum 2 options required. Submit button disabled until requirement met. Shows validation message |
| **XSS Attacks** | React auto-escaping + Firestore rules | React automatically escapes user input. Firestore security rules validate data types and field requirements |
| **Real-Time Listener Memory Leak** | Proper cleanup with useEffect | `onSnapshot` listener is unsubscribed in cleanup function to prevent memory leaks on component unmount |
| **Poll Not Found (Deleted)** | Real-time detection | If poll is deleted while user viewing, listener detects and shows "Poll no longer exists" message |
| **Extreme Vote Counts** | Number overflow protection | Firestore numbers support up to 2^53-1 (JavaScript safe integer limit). Unlikely to reach in normal usage |

### Detailed Edge Case Examples

#### Case 1: Race Condition During Concurrent Votes
**Scenario:** Two users vote for the same option within milliseconds.

**Without Protection:**
```
User A reads vote_count: 10
User B reads vote_count: 10
User A writes vote_count: 11
User B writes vote_count: 11  ❌ Lost User A's vote!
```

**With Firestore Transactions:**
```typescript
await runTransaction(db, async (transaction) => {
  transaction.update(optionRef, {
    vote_count: increment(1)  // Atomic operation
  });
});
```
**Result:** Both votes counted correctly → final count is 12

---

#### Case 2: Network Timeout During Vote Submission
**Scenario:** User clicks vote but WiFi disconnects before server responds.

**Behavior:**
1. Optimistic update shows vote count increase immediately
2. POST request times out after 10 seconds
3. Client catches error in try/catch block
4. Vote count reverted to previous value
5. Error toast: "Failed to submit vote. Please check your connection."
6. User can retry voting (localStorage not marked yet)

---

#### Case 3: Shared Office WiFi Limitation
**Scenario:** 50 employees want to vote on lunch options from the same office network.

**What Happens:**
- First employee votes successfully ✅
- Remaining 49 employees see: "You have already voted on this poll"
- IP check badge shows ⚠️ instead of ✅
- Explanation text: "Note: Multiple users on the same network (office/school WiFi) share an IP address"

**Workaround for Users:**
- Vote from mobile data (different IP)
- Use personal hotspot
- Create separate polls for different departments

**Why This Trade-off?**
- Alternative would be requiring login (worse UX)
- Cookie-based tracking can be cleared
- Device fingerprinting is less reliable and privacy-invasive
- Accepting this limitation keeps the app simple and accessible

---

## ⚠️ Known Limitations

### Security & Anti-Abuse

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **Shared IP Blocking** | Users on same network (office, school, public WiFi) can't all vote | Implement authentication system with email/social login |
| **VPN Bypass** | Sophisticated users can switch VPN servers to vote multiple times | Add CAPTCHA verification or rate limiting per time period |
| **localStorage Clearing** | Client-side check bypassed by clearing browser data or incognito mode | Server-side IP check still enforces limit (this is acceptable) |
| **Dynamic IP Exploitation** | Users with frequently changing IPs (mobile data) might vote multiple times | Implement device fingerprinting with Canvas/WebGL/Audio APIs |
| **No Poll Deletion** | Once created, polls exist forever in Firestore | Add poll ownership with authentication and delete functionality |
| **No Poll Editing** | Typos in questions/options cannot be fixed after creation | Add authentication and edit within X minutes of creation |
| **Public Polls** | All polls are discoverable if someone guesses/finds the URL | Add optional password protection or unlisted/private modes |

### User Experience

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **Poll History Limited to Browser** | Clearing localStorage loses all poll history | Add optional account creation with cloud sync |
| **No Poll Expiration** | Polls remain open indefinitely | Add optional end date/time with automatic closure |
| **Single-Choice Only** | Users can only select one option | Implement multi-select mode as an option |
| **No Vote Changes** | Once voted, cannot change selection | Add "Change Vote" button with re-validation |
| **No Results Before Voting** | Results only visible after voting (could be seen as limitation or feature) | Add toggle for poll creator to show/hide results before voting |
| **Mobile QR Scanning** | Users on mobile can't scan QR code displayed on same device | Add "Copy Link" as primary action on mobile, QR as secondary |

### Technical

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **Firestore Read Costs** | Real-time listeners cost 1 read per change per client | Implement read budget limits or move to WebSocket-based solution |
| **No Offline Support** | App requires internet connection to create/vote | Add Progressive Web App (PWA) with service worker caching |
| **No Data Export** | Poll creators can't export results to CSV/PDF | Add export functionality in poll options menu |
| **No Analytics** | No insights on voting patterns, peak times, demographics | Integrate Google Analytics or build custom dashboard |
| **No Moderation Tools** | No way to remove polls with inappropriate content | Add report button and admin moderation panel |
| **Test Mode Firestore Rules** | Security rules are permissive for ease of use | Tighten rules to validate data shapes and prevent abuse |

### Performance

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **Listener Scalability** | With 1000+ simultaneous viewers, Firestore costs increase significantly | Implement polling instead of real-time for high-traffic polls |
| **No Pagination** | If a poll has 100+ options, page load will be slow | Add pagination or virtualized list for options |
| **Animation Performance** | Framer Motion animations might lag on low-end devices | Add reduced motion media query support |
| **Large Vote Counts** | Displaying "1,234,567 votes" without formatting | Add number formatting with commas/abbreviations (1.2M) |

### Privacy & Compliance

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **IP Address Collection** | Might require disclosure in some jurisdictions (GDPR, CCPA) | Add privacy policy and cookie consent banner |
| **No Data Retention Policy** | Votes stored indefinitely | Implement automatic deletion after 90 days or add data retention settings |
| **No User Data Deletion** | No way for users to request IP hash removal | Add "Delete My Data" form with poll ID submission |

---

### Acceptance Criteria

These limitations are **accepted trade-offs** for the current scope because:

1. **Simplicity Over Features**: The app prioritizes ease of use (no login) over bullet-proof security
2. **MVP Focus**: This is a demonstration/portfolio project, not an enterprise solution
3. **Cost Efficiency**: Avoiding authentication systems and advanced fingerprinting keeps Firestore costs low
4. **Educational Value**: Showcases real-time capabilities and basic anti-abuse without over-engineering

**For production use at scale**, consider implementing authentication, advanced rate limiting, and poll management features.

---

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
