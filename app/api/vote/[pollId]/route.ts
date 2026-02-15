import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, runTransaction, Transaction } from 'firebase/firestore';
import crypto from 'crypto';

// Hash IP address server-side
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Get client IP address from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const body = await request.json();
    const { optionId, deviceId } = body;

    // Validate required fields
    if (!optionId || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get and hash client IP
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Check if this IP has already voted on this poll
    const votesQuery = query(
      collection(db, 'votes'),
      where('poll_id', '==', pollId),
      where('ip_hash', '==', ipHash)
    );
    
    const existingVotes = await getDocs(votesQuery);

    if (!existingVotes.empty) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 429 }
      );
    }

    // Use Firestore transaction for atomic operation
    try {
      await runTransaction(db, async (transaction: Transaction) => {
        // 1. Record the vote
        const voteRef = doc(collection(db, 'votes'));
        transaction.set(voteRef, {
          poll_id: pollId,
          ip_hash: ipHash,
          device_id: deviceId,
          created_at: serverTimestamp(),
        });

        // 2. Increment vote count atomically
        const optionRef = doc(db, 'options', optionId);
        transaction.update(optionRef, {
          vote_count: increment(1)
        });
      });

      return NextResponse.json({ success: true });
    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
