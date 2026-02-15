import { nanoid } from 'nanoid';

// Generate or retrieve device ID from localStorage
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// Check if user has voted on a specific poll
export function hasVoted(pollId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`voted_poll_${pollId}`) === 'true';
}

// Mark a poll as voted
export function markAsVoted(pollId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`voted_poll_${pollId}`, 'true');
}

// Hash IP address for privacy (simple hash function)
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Poll history management
const POLL_HISTORY_KEY = 'poll_history';
const MAX_HISTORY_SIZE = 10;

export interface PollHistoryItem {
  id: string;
  question: string;
  createdAt: number;
}

// Save a poll to history when created
export function savePollToHistory(pollId: string, question: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getPollHistory();
    const newItem: PollHistoryItem = {
      id: pollId,
      question,
      createdAt: Date.now(),
    };
    
    // Add to beginning, remove duplicates, limit size
    const updatedHistory = [
      newItem,
      ...history.filter(item => item.id !== pollId)
    ].slice(0, MAX_HISTORY_SIZE);
    
    localStorage.setItem(POLL_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save poll to history:', error);
  }
}

// Get poll history
export function getPollHistory(): PollHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(POLL_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get poll history:', error);
    return [];
  }
}

// Clear poll history
export function clearPollHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(POLL_HISTORY_KEY);
}
