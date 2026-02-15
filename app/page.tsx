'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { savePollToHistory, getPollHistory, PollHistoryItem } from '@/lib/utils';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollHistory, setPollHistory] = useState<PollHistoryItem[]>([]);

  // Load poll history on mount
  useEffect(() => {
    setPollHistory(getPollHistory());
  }, []);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!question.trim()) {
      setError('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    setLoading(true);

    try {
      // Create poll
      const pollRef = await addDoc(collection(db, 'polls'), {
        question: question.trim(),
        created_at: serverTimestamp(),
      });

      const pollId = pollRef.id;

      // Create options
      const optionsCollection = collection(db, 'options');
      const optionPromises = validOptions.map(opt =>
        addDoc(optionsCollection, {
          poll_id: pollId,
          option_text: opt.trim(),
          vote_count: 0,
          created_at: serverTimestamp(),
        })
      );

      await Promise.all(optionPromises);

      // Save to poll history
      savePollToHistory(pollId, question.trim());

      // Redirect to poll page
      router.push(`/poll/${pollId}`);
    } catch (err: any) {
      console.error('Error creating poll:', err);
      
      // Provide more specific error messages
      if (err.code === 'permission-denied') {
        setError('Database permission denied. Please check Firestore security rules.');
      } else if (err.message?.includes('Missing or insufficient permissions')) {
        setError('Missing Firestore permissions. Did you create the database and apply security rules?');
      } else if (err.code === 'failed-precondition') {
        setError('Firestore database not initialized. Please create a Firestore database in Firebase Console.');
      } else {
        setError(`Failed to create poll: ${err.message || 'Please check console for details'}`);
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffedd8] via-[#f3d5b5] to-[#e7bc91] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-tl from-[#d4a276]/30 via-transparent to-transparent -z-10" />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#bc8a5f] to-[#a47148] text-white text-sm font-medium shadow-lg mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Real-time Polling Platform
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#8b5e34] via-[#6f4518] to-[#8b5e34] bg-clip-text text-transparent mb-3">
            Poll Room
          </h1>
          <p className="text-[#a47148] text-lg">
            Create instant polls, share unique links, watch results flow in real-time
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-[#f3d5b5]/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-[#bc8a5f] to-[#a47148] rounded-full" />
            <h2 className="text-2xl font-bold text-[#6f4518]">
              Create New Poll
            </h2>
          </div>

          <form onSubmit={createPoll}>
            {/* Poll Question */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#8b5e34] mb-2">
                Your Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-4 py-3.5 bg-gradient-to-br from-[#ffedd8] to-[#f3d5b5] border-2 border-[#e7bc91] rounded-xl focus:ring-2 focus:ring-[#bc8a5f] focus:border-[#bc8a5f] outline-none transition-all text-[#6f4518] placeholder-[#bc8a5f]/50 font-medium shadow-sm"
                disabled={loading}
              />
            </div>

            {/* Poll Options */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#8b5e34] mb-2">
                Answer Options (min. 2)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-[#d4a276] to-[#bc8a5f]" />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-[#f3d5b5] rounded-xl focus:ring-2 focus:ring-[#d4a276] focus:border-[#d4a276] outline-none transition-all text-[#6f4518] placeholder-[#bc8a5f]/40 shadow-sm"
                        disabled={loading}
                      />
                    </div>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-4 py-2 text-[#a47148] hover:bg-[#ffedd8] rounded-xl transition-all border-2 border-transparent hover:border-[#f3d5b5]"
                        disabled={loading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-[#a47148] hover:text-[#8b5e34] font-semibold text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[#ffedd8] transition-all"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another option
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-800 rounded-xl text-sm font-medium shadow-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#bc8a5f] via-[#a47148] to-[#8b5e34] text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Poll...
                  </>
                ) : (
                  <>
                    Create Poll
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#8b5e34] to-[#6f4518] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>
        </div>

        {/* Recent Polls */}
        {pollHistory.length > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-[#f3d5b5]/50">
            <h2 className="font-bold text-[#6f4518] mb-4 flex items-center gap-2 text-lg">
              Your Recent Polls
            </h2>
            <div className="space-y-2">
              {pollHistory.map((poll) => (
                <Link
                  key={poll.id}
                  href={`/poll/${poll.id}`}
                  className="block p-4 rounded-xl border-2 border-[#f3d5b5] hover:border-[#d4a276] bg-gradient-to-br from-white to-[#ffedd8]/30 hover:from-[#ffedd8] hover:to-[#f3d5b5] transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#bc8a5f] to-[#a47148] group-hover:scale-125 transition-transform" />
                      <p className="text-sm font-semibold text-[#6f4518] group-hover:text-[#8b5e34] truncate">
                        {poll.question}
                      </p>
                    </div>
                    <span className="text-xs text-[#a47148] ml-2 px-2 py-1 rounded-lg bg-[#ffedd8]/50 flex-shrink-0">
                      {new Date(poll.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-xs text-[#bc8a5f] mt-4 flex items-center gap-1.5 bg-[#ffedd8]/50 px-3 py-2 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Polls are saved in your browser. Clear browser data to remove.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-br from-white/90 to-[#ffedd8]/60 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-[#f3d5b5]/50">
          <h2 className="font-bold text-[#6f4518] mb-4 flex items-center gap-2 text-lg">
            <svg className="w-6 h-6 text-[#bc8a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How it works
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#8b5e34]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                1
              </div>
              <span className="font-medium">Create your poll with a question and multiple options</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#8b5e34]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                2
              </div>
              <span className="font-medium">Share the unique link with anyone via QR code or native share</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#8b5e34]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                3
              </div>
              <span className="font-medium">Watch results update in real-time with smooth animations</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#8b5e34]">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4a276] to-[#bc8a5f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                4
              </div>
              <span className="font-medium">No login required – voting is instant and secure</span>
            </li>
          </ul>
          
          <div className="mt-6 pt-4 border-t-2 border-[#f3d5b5]">
            <div className="flex items-center gap-2 text-xs text-[#a47148]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm" />
                <span className="font-semibold">Browser Check</span>
              </div>
              <span>+</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm" />
                <span className="font-semibold">IP Validation</span>
              </div>
              <span className="mx-1">=</span>
              <span className="font-bold text-[#8b5e34]">Fair Voting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
