-- Create goals table to store user goals with nested data as JSON
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  current NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  colorIdx INTEGER NOT NULL DEFAULT 0,
  subgoals JSONB NOT NULL DEFAULT '[]'::jsonb,
  rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS goals_created_at_idx ON goals(created_at);
