-- Database Schema for Poll Room Application
-- Run this SQL in your Supabase SQL Editor

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create options table
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table for anti-abuse tracking
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, ip_hash)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_options_poll_id ON options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_ip_hash ON votes(poll_id, ip_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on options" ON options
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on votes" ON votes
  FOR SELECT USING (true);

-- Create policies for insert operations
CREATE POLICY "Allow public insert on polls" ON polls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on options" ON options
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Create policy for vote count updates
CREATE POLICY "Allow public update on options vote_count" ON options
  FOR UPDATE USING (true) WITH CHECK (true);

-- Enable Realtime for the options table
ALTER PUBLICATION supabase_realtime ADD TABLE options;

-- Create function for atomic vote count increment
CREATE OR REPLACE FUNCTION increment_vote_count(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
