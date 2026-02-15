# Poll Room - Technical Architecture

## Overview

Poll Room is a real-time polling application that demonstrates modern web application architecture with emphasis on simplicity, stability, and security.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser (Next.js App Router)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Page: /                                               │   │
│  │  - Poll creation form                                  │   │
│  │  - Validation (2+ options)                             │   │
│  │                                                         │   │
│  │  Page: /poll/[id]                                      │   │
│  │  - Poll viewing/voting                                 │   │
│  │  - Real-time updates (WebSocket)                       │   │
│  │  - Optimistic UI updates                               │   │
│  │  - localStorage check                                  │   │
│  │                                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                   │
└──────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Next.js API Routes                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/vote/[pollId]                             │   │
│  │  - Extract & hash IP address                          │   │
│  │  - Check votes table for duplicates                    │   │
│  │  - Record vote atomically                              │   │
│  │  - Return success/error                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                   │
└──────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PostgreSQL Database                                        │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   polls      │   options    │    votes     │            │
│  ├──────────────┼──────────────┼──────────────┤            │
│  │ - id         │ - id         │ - id         │            │
│  │ - question   │ - poll_id    │ - poll_id    │            │
│  │ - created_at │ - text       │ - ip_hash    │            │
│  │              │ - vote_count │ - device_id  │            │
│  │              │ - created_at │ - created_at │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                             │
│  Realtime (WebSocket)                                       │
│  - Broadcasts UPDATE events on options table                │
│  - All connected clients receive instant updates            │
│                                                             │
│  Functions                                                  │
│  - increment_vote_count(option_id): Atomic increment        │
│                                                             │
│  Row Level Security (RLS)                                   │
│  - Public read access                                       │
│  - Public insert access                                     │
│  - Public update on vote_count                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Poll Creation Flow

```
User Input (Question + Options)
    ↓
Validation (Client-side)
    ↓
Supabase Client INSERT → polls table
    ↓
Get poll.id (UUID)
    ↓
Supabase Client INSERT → options table (batch)
    ↓
Redirect to /poll/[id]
```

### 2. Voting Flow

```
User Clicks Option
    ↓
localStorage Check (voted_poll_[id])
    ├─ Found → Show "Already voted" → STOP
    └─ Not Found → Continue
            ↓
    Optimistic UI Update (+1 vote count)
            ↓
    POST /api/vote/[pollId]
            ↓
    Server: Extract IP → Hash (SHA-256)
            ↓
    Server: Query votes table (poll_id + ip_hash)
            ├─ Found → Return 429 → Revert UI → STOP
            └─ Not Found → Continue
                    ↓
            INSERT into votes table
                    ↓
            Call increment_vote_count(option_id)
                    ↓
            Database: UPDATE options SET vote_count = vote_count + 1
                    ↓
            Supabase Realtime broadcasts UPDATE event
                    ↓
            All connected clients receive update
                    ↓
            UI updates automatically
                    ↓
            localStorage.setItem('voted_poll_[id]', 'true')
```

### 3. Real-Time Synchronization Flow

```
Client Connects to /poll/[id]
    ↓
Establish Realtime Channel (WebSocket)
    ↓
Subscribe to: postgres_changes → options table → poll_id filter
    ↓
Wait for UPDATE events
    ↓
On UPDATE event received:
    - Extract payload.new (updated option data)
    - Update local state
    - React re-renders UI with new vote count
```

## Technical Decisions

### Why Next.js App Router?

- **Server Components**: Reduce client-side JS
- **API Routes**: Built-in backend without separate server
- **File-based Routing**: `/poll/[id]` → Dynamic routes out of the box
- **TypeScript Support**: Type safety across frontend and API
- **Vercel Deployment**: One-click deployment with zero config

### Why Supabase?

- **PostgreSQL**: Reliable, ACID-compliant database
- **Realtime Built-in**: WebSocket subscriptions without additional infrastructure
- **Row Level Security**: Database-level access control
- **Auto-generated API**: REST and Realtime APIs from schema
- **Free Tier**: Sufficient for demo and small production apps
- **Open Source**: Can self-host if needed

### Why Tailwind CSS?

- **Rapid Development**: Utility-first classes speed up styling
- **No CSS Files**: Styles colocated with components
- **Responsive**: Mobile-first responsive utilities
- **Tree Shaking**: Only used classes in production bundle
- **Customizable**: Easy to theme and extend

## Anti-Abuse Implementation

### Mechanism 1: Client-Side (localStorage)

**Purpose**: User convenience and instant feedback

**Implementation**:
```typescript
// lib/utils.ts
export function hasVoted(pollId: string): boolean {
  return localStorage.getItem(`voted_poll_${pollId}`) === 'true';
}
```

**Pros**:
- ✅ Instant check (no network request)
- ✅ Prevents accidental double-clicks
- ✅ Good UX for honest users

**Cons**:
- ❌ Easily bypassed (clear storage, incognito mode)
- ❌ Not secure against malicious actors

### Mechanism 2: Server-Side (IP Hashing)

**Purpose**: Prevent actual vote manipulation

**Implementation**:
```typescript
// app/api/vote/[pollId]/route.ts
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Check in database
const { data: existingVote } = await supabase
  .from('votes')
  .select('id')
  .eq('poll_id', pollId)
  .eq('ip_hash', ipHash)
  .single();

if (existingVote) {
  return NextResponse.json({ error: 'Already voted' }, { status: 429 });
}
```

**Pros**:
- ✅ Works even if localStorage is cleared
- ✅ Prevents incognito mode bypass
- ✅ Privacy-preserving (hashed IPs)
- ✅ Database-level unique constraint

**Cons**:
- ❌ Shared networks (office/school WiFi) share IP
- ❌ VPN users can switch IPs
- ❌ Dynamic IPs may change between sessions

**Edge Case Handling**:
- Shared networks: First person to vote blocks others on same IP
- This is acceptable for the use case (prevent mass voting)
- Future enhancement: Add CAPTCHA for borderline cases

## Atomic Operations & Race Conditions

### Problem

Two users vote at the exact same time:

```
Time 0: Option has 10 votes
Time 1: User A reads vote_count = 10
Time 1: User B reads vote_count = 10
Time 2: User A writes vote_count = 11
Time 3: User B writes vote_count = 11
Result: Vote count is 11 (should be 12) ❌
```

### Solution: Database-Level Atomic Increment

```sql
-- supabase-schema.sql
CREATE OR REPLACE FUNCTION increment_vote_count(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why This Works**:
- Database performs the increment in a single transaction
- `vote_count = vote_count + 1` reads and writes atomically
- PostgreSQL's MVCC ensures no lost updates
- Even with 100 concurrent votes, all are counted correctly

## Optimistic UI Updates

### Purpose
Provide instant feedback while waiting for server response

### Implementation

```typescript
// Immediately update UI
setOptions((prev) =>
  prev.map((opt) =>
    opt.id === optionId
      ? { ...opt, vote_count: opt.vote_count + 1 }
      : opt
  )
);

// Make API call
const response = await fetch('/api/vote/...', ...);

if (!response.ok) {
  // Revert on error
  setOptions((prev) =>
    prev.map((opt) =>
      opt.id === optionId
        ? { ...opt, vote_count: opt.vote_count - 1 }
        : opt
    )
  );
}
```

**Benefits**:
- ✅ Instant UI response (perceived performance)
- ✅ Maintains consistency on failure
- ✅ Users see their action took effect immediately

## Real-Time Subscriptions

### Supabase Realtime Architecture

```typescript
const channel = supabase
  .channel(`poll-${pollId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'options',
      filter: `poll_id=eq.${pollId}`,
    },
    (payload) => {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === payload.new.id ? payload.new : opt
        )
      );
    }
  )
  .subscribe();
```

**How It Works**:
1. PostgreSQL has a replication slot
2. Supabase listens to database changes
3. Changes are broadcast via WebSocket to subscribed clients
4. Client receives payload with new data
5. React state updates → Component re-renders

**Cleanup**:
```typescript
return () => {
  supabase.removeChannel(channel);
};
```
- Prevents memory leaks
- Closes WebSocket connection when component unmounts

## Security Considerations

### Row Level Security (RLS)

```sql
-- Allow anyone to read
CREATE POLICY "Allow public read access on polls" ON polls
  FOR SELECT USING (true);

-- Allow anyone to create
CREATE POLICY "Allow public insert on polls" ON polls
  FOR INSERT WITH CHECK (true);
```

**Why Public Access?**
- No authentication required (feature, not bug)
- Polls are meant to be shared publicly
- Abuse prevented by IP tracking, not authentication

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Why `NEXT_PUBLIC_`?**
- These are safe to expose to the browser
- RLS policies prevent unauthorized operations
- Anon key has limited permissions (can't delete, etc.)

**Note**: Never expose `SERVICE_ROLE_KEY` to the client!

### IP Address Hashing

```typescript
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

**Privacy Benefits**:
- Original IP is never stored
- Hash is one-way (can't reverse to get IP)
- Same IP always produces same hash (for duplicate checking)
- Compliant with privacy regulations (GDPR, etc.)

## Performance Optimizations

### 1. Database Indexes

```sql
CREATE INDEX idx_options_poll_id ON options(poll_id);
CREATE INDEX idx_votes_ip_hash ON votes(poll_id, ip_hash);
```

**Impact**:
- Faster lookups when checking for existing votes
- Efficient filtering for real-time subscriptions

### 2. Query Optimization

```typescript
// Single query with filter
.select('*')
.eq('poll_id', pollId)
.single()

// Avoids N+1 query problem
```

### 3. Client-Side Caching

- localStorage caches vote status
- Prevents unnecessary API calls
- Instant UI state on page refresh

## Error Handling

### Invalid Poll ID

```typescript
if (pollError.code === 'PGRST116') {
  setError('Poll not found');
  // Show custom 404 page
}
```

### Network Failures

```typescript
try {
  const response = await fetch('/api/vote/...');
  // ...
} catch (err) {
  setError('Network error. Please try again.');
  // Revert optimistic update
}
```

### Database Constraint Violations

```typescript
if (voteError.code === '23505') {
  // Unique constraint violation
  return NextResponse.json({ error: 'Already voted' }, { status: 429 });
}
```

## Deployment Architecture

```
GitHub Repository
    ↓
Vercel (CI/CD)
    ↓
Build Next.js app
    ↓
Deploy to Edge Network (CDN)
    ↓
User requests via nearest edge server
    ↓
API routes run on serverless functions
    ↓
Database requests to Supabase
```

**Benefits**:
- ✅ Global CDN (fast page loads)
- ✅ Auto-scaling (handles traffic spikes)
- ✅ Zero-downtime deployments
- ✅ Automatic HTTPS
- ✅ Git-based deployments

## Future Enhancements

### 1. Rate Limiting (DDoS Protection)

```typescript
// Add rate limiting middleware
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### 2. Poll Expiration

```sql
ALTER TABLE polls ADD COLUMN expires_at TIMESTAMP;
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
```

### 3. Analytics Dashboard

- Track total polls created
- Most popular polls
- Vote trends over time
- Geographic distribution (if storing region)

### 4. Advanced Anti-Abuse

- Device fingerprinting
- CAPTCHA on suspicious activity
- Proof-of-work challenges

## Testing Strategy

### Unit Tests
- Utility functions (hashIP, hasVoted, etc.)
- API route handlers

### Integration Tests
- Poll creation flow
- Voting flow
- Real-time updates

### E2E Tests (Playwright)
```typescript
test('create and vote on poll', async ({ page, context }) => {
  // Create poll
  await page.goto('/');
  await page.fill('[name="question"]', 'Test?');
  // ... Vote in multiple windows
  // ... Verify real-time updates
});
```

## Monitoring & Observability

### Supabase Dashboard
- Database metrics
- API usage
- Real-time connections
- Error logs

### Vercel Analytics
- Page load times
- Core Web Vitals
- Function execution time
- Error tracking

## Conclusion

Poll Room demonstrates a modern, production-ready web application with:

- ✅ Real-time capabilities
- ✅ Abuse prevention
- ✅ Scalable architecture
- ✅ Clean code organization
- ✅ Type safety
- ✅ Edge case handling
- ✅ Privacy-preserving design

The architecture is simple yet robust, prioritizing developer experience and user experience equally.
