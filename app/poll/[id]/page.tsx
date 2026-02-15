'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Poll, Option } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, Timestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getDeviceId, hasVoted, markAsVoted } from '@/lib/utils';

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch poll data
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchPoll = async () => {
      try {
        // Fetch poll
        const pollDoc = await getDoc(doc(db, 'polls', pollId));

        if (!pollDoc.exists()) {
          setError('Poll not found');
          setLoading(false);
          return;
        }

        const pollData = { id: pollDoc.id, ...pollDoc.data() } as Poll;
        setPoll(pollData);

        // Fetch options with real-time listener
        const optionsQuery = query(
          collection(db, 'options'),
          where('poll_id', '==', pollId),
          orderBy('created_at', 'asc')
        );

        unsubscribe = onSnapshot(optionsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
          const optionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Option[];
          
          setOptions(optionsData);
          setLoading(false);
        });

        // Check if already voted (client-side check)
        setAlreadyVoted(hasVoted(pollId));
      } catch (err) {
        console.error('Error fetching poll:', err);
        setError('Failed to load poll');
        setLoading(false);
      }
    };

    fetchPoll();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pollId]);

  const handleVote = async (optionId: string) => {
    if (voting || alreadyVoted) return;

    setVoting(true);
    setError('');

    try {
      const deviceId = getDeviceId();

      // Optimistic UI update
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId
            ? { ...opt, vote_count: opt.vote_count + 1 }
            : opt
        )
      );

      const response = await fetch(`/api/vote/${pollId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId, deviceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update
        setOptions((prev) =>
          prev.map((opt) =>
            opt.id === optionId
              ? { ...opt, vote_count: opt.vote_count - 1 }
              : opt
          )
        );

        if (response.status === 429) {
          setError('You have already voted on this poll');
          setAlreadyVoted(true);
          markAsVoted(pollId);
        } else {
          setError(data.error || 'Failed to submit vote');
        }
        setVoting(false);
        return;
      }

      // Mark as voted in localStorage
      markAsVoted(pollId);
      setAlreadyVoted(true);
      setSelectedOption(optionId);
      setVoting(false);
    } catch (err) {
      console.error('Error voting:', err);
      // Revert optimistic update
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId
            ? { ...opt, vote_count: opt.vote_count - 1 }
            : opt
        )
      );
      setError('Network error. Please try again.');
      setVoting(false);
    }
  };

  const getTotalVotes = () => {
    return options.reduce((sum, opt) => sum + opt.vote_count, 0);
  };

  const getPercentage = (voteCount: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  };

  const copyLinkToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error === 'Poll not found') {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Poll Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The poll you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Create New Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Poll Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {poll?.question}
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{getTotalVotes()} total votes</span>
              <button
                onClick={copyLinkToClipboard}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share Link
              </button>
            </div>
          </div>

          {/* Voted Status */}
          {alreadyVoted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✓ You have already voted in this poll
            </div>
          )}

          {/* Error Message */}
          {error && error !== 'Poll not found' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {options.map((option) => {
              const percentage = getPercentage(option.vote_count);
              const isSelected = selectedOption === option.id;

              return (
                <div key={option.id} className="relative">
                  <button
                    onClick={() => handleVote(option.id)}
                    disabled={alreadyVoted || voting}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      alreadyVoted || voting
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:border-indigo-400'
                    } ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Progress Bar */}
                    <div
                      className="absolute inset-0 bg-indigo-50 rounded-lg transition-all duration-300"
                      style={{ width: `${percentage}%`, zIndex: 0 }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {option.option_text}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {option.vote_count} votes
                        </span>
                        <span className="font-semibold text-indigo-600 min-w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-2">
            About this poll
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Results update in real-time</li>
            <li>• One vote per device and IP address</li>
            <li>
              • Created on{' '}
              {poll?.created_at instanceof Timestamp
                ? poll.created_at.toDate().toLocaleDateString()
                : new Date(poll?.created_at || '').toLocaleDateString()}
            </li>
          </ul>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            ← Create your own poll
          </button>
        </div>
      </div>
    </div>
  );
}
