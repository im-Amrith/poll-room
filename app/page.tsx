'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a Poll
          </h1>
          <p className="text-gray-600 mb-8">
            Create a poll and share it with anyone via a unique link
          </p>

          <form onSubmit={createPoll}>
            {/* Poll Question */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your question?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Poll Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options (minimum 2)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      disabled={loading}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                disabled={loading}
              >
                + Add another option
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Poll...' : 'Create Poll'}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-2">How it works</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create your poll with a question and multiple options</li>
            <li>• Share the unique link with anyone</li>
            <li>• See results update in real-time</li>
            <li>• No login required for voting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
