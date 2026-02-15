'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Poll, Option } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, Timestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getDeviceId, hasVoted, markAsVoted } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeSVG from 'react-qr-code';

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
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [browserCheckPassed, setBrowserCheckPassed] = useState(false);
  const [ipCheckPassed, setIpCheckPassed] = useState(false);

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
        const voted = hasVoted(pollId);
        setAlreadyVoted(voted);
        setBrowserCheckPassed(!voted); // Passing means not voted yet
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
          setBrowserCheckPassed(false);
          setIpCheckPassed(false);
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
      setBrowserCheckPassed(true);
      setIpCheckPassed(true);
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

  const shareOrCopyLink = async () => {
    const url = window.location.href;
    const title = poll?.question || 'Check out this poll!';

    // Try Web Share API first (mobile native sharing)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Vote on: ${title}`,
          url: url,
        });
        return;
      } catch (err: any) {
        // User cancelled or API failed, fall through to copy
        if (err.name !== 'AbortError') {
          console.log('Share failed:', err);
        }
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffedd8] via-[#f3d5b5] to-[#e7bc91] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#d4a276]/30 via-transparent to-transparent" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#f3d5b5] border-t-[#bc8a5f] mx-auto shadow-xl"></div>
          <p className="mt-6 text-[#8b5e34] font-semibold text-lg">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error === 'Poll not found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffedd8] via-[#f3d5b5] to-[#e7bc91] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#d4a276]/30 via-transparent to-transparent" />
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-10 max-w-md text-center border border-[#f3d5b5]/50 relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-4xl shadow-xl">
            🔍
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8b5e34] to-[#6f4518] bg-clip-text text-transparent mb-3">
            Poll Not Found
          </h1>
          <p className="text-[#a47148] mb-8 leading-relaxed">
            The poll you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#bc8a5f] via-[#a47148] to-[#8b5e34] text-white py-3 px-8 rounded-xl font-semibold hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Create New Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffedd8] via-[#f3d5b5] to-[#e7bc91] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-tl from-[#d4a276]/30 via-transparent to-transparent -z-10" />
      
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-[#8b5e34] hover:text-[#6f4518] font-semibold px-4 py-2 rounded-xl hover:bg-white/50 transition-all group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Create your own poll
        </button>

        {/* Poll Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-[#f3d5b5]/50">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-1.5 h-20 bg-gradient-to-b from-[#bc8a5f] via-[#a47148] to-[#8b5e34] rounded-full" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#6f4518] leading-tight">
                  {poll?.question}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {getTotalVotes()}
                </div>
                <span className="text-[#8b5e34] font-semibold">total votes</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={shareOrCopyLink}
                  className="text-[#bc8a5f] hover:text-[#8b5e34] font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-[#ffedd8] to-[#f3d5b5] hover:from-[#f3d5b5] hover:to-[#e7bc91] transition-all shadow-sm hover:shadow-md border border-[#e7bc91]/30"
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
                  {copySuccess ? '✓ Copied!' : 'Share'}
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="text-[#a47148] hover:text-[#8b5e34] font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#ffedd8] transition-all shadow-sm hover:shadow-md border border-[#f3d5b5]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  QR
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            <AnimatePresence>
              {showQRCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-6 bg-gradient-to-br from-white to-[#ffedd8] rounded-2xl flex flex-col items-center border-2 border-[#f3d5b5] shadow-lg"
                >
                  <p className="text-sm font-semibold text-[#8b5e34] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Scan to vote instantly
                  </p>
                  <div className="p-4 bg-white rounded-xl shadow-inner">
                    <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={200} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voter Integrity Indicators */}
            {alreadyVoted && (
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl text-sm text-emerald-800 font-semibold shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Browser Check Passed
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl text-sm text-emerald-800 font-semibold shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  IP Check Passed
                </div>
              </div>
            )}
          </div>

          {/* Voted Status */}
          {alreadyVoted && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You have already voted in this poll
            </div>
          )}

          {/* Error Message */}
          {error && error !== 'Poll not found' && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 text-red-800 rounded-xl text-sm font-semibold flex items-start gap-2 shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {options.map((option) => {
              const percentage = getPercentage(option.vote_count);
              const isSelected = selectedOption === option.id;
              const isLeader = option.vote_count > 0 && option.vote_count === Math.max(...options.map(o => o.vote_count));

              return (
                <motion.div
                  key={option.id}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => handleVote(option.id)}
                    disabled={alreadyVoted || voting}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all overflow-hidden ${
                      alreadyVoted || voting
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:border-[#d4a276] hover:shadow-lg'
                    } ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-200'
                        : isLeader
                        ? 'border-[#bc8a5f]'
                        : 'border-[#f3d5b5]'
                    } ${
                      !alreadyVoted && !voting ? 'hover:scale-[1.01]' : ''
                    }`}
                  >
                    {/* Animated Progress Bar */}
                    <motion.div
                      className={`absolute inset-0 rounded-xl ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50'
                          : isLeader
                          ? 'bg-gradient-to-r from-[#f3d5b5] to-[#e7bc91]'
                          : 'bg-gradient-to-r from-[#ffedd8] to-[#f3d5b5]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ zIndex: 0 }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {isLeader && !isSelected && getTotalVotes() > 0 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                        <span className={`font-semibold ${isSelected ? 'text-emerald-900' : 'text-[#6f4518]'}`}>
                          {option.option_text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <motion.span
                          key={option.vote_count}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`text-sm font-medium ${isSelected ? 'text-emerald-700' : 'text-[#a47148]'}`}
                        >
                          {option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}
                        </motion.span>
                        <motion.span
                          key={`pct-${percentage}`}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          className={`text-xl font-bold min-w-14 text-right ${
                            isSelected
                              ? 'text-emerald-600'
                              : isLeader
                              ? 'text-[#8b5e34]'
                              : 'text-[#bc8a5f]'
                          }`}
                        >
                          {percentage}%
                        </motion.span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
