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
