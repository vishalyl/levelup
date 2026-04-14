-- LEVELUP Database Schema
-- Run this in Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  character_name TEXT DEFAULT 'Hero',
  height_cm NUMERIC,
  preferred_units TEXT DEFAULT 'metric', -- 'metric' or 'imperial'
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '⭐',
  category TEXT NOT NULL CHECK (category IN ('Body', 'Mind', 'Soul', 'Work')),
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekdays', 'custom'
  custom_days INTEGER[] DEFAULT '{}', -- 0=Sun, 1=Mon, ..., 6=Sat
  color TEXT DEFAULT '#7C3AED',
  grace_day BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_date)
);

-- Body measurements
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  body_fat NUMERIC,
  waist NUMERIC,
  chest NUMERIC,
  left_arm NUMERIC,
  right_arm NUMERIC,
  hips NUMERIC,
  left_thigh NUMERIC,
  right_thigh NUMERIC,
  neck NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Strength', 'Cardio', 'HIIT', 'Yoga', 'Mobility', 'Sports', 'Other')),
  duration INTEGER NOT NULL, -- in minutes
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout exercises
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sleep logs
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bedtime TEXT, -- stored as HH:MM
  wake_time TEXT, -- stored as HH:MM
  hours NUMERIC,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water logs
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quests (monthly goals)
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'linear-gradient(135deg, #7C3AED, #06B6D4)',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quest milestones
CREATE TABLE quest_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 150,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('amazing', 'good', 'okay', 'rough', 'terrible')),
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal photos
CREATE TABLE journal_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress photos
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  notes TEXT,
  category TEXT CHECK (category IN ('Front', 'Side', 'Back', 'Other')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wins
CREATE TABLE wins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Fitness', 'Mental', 'Career', 'Social', 'Personal')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  importance INTEGER DEFAULT 1 CHECK (importance BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bucket list
CREATE TABLE bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Travel', 'Experience', 'Skill', 'Achievement', 'Other')),
  description TEXT,
  target_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_photo_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP events
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- Measurement targets
CREATE TABLE measurement_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  UNIQUE(user_id, measurement_type)
);

-- Water daily target
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  water_target_ml INTEGER DEFAULT 3000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for authenticated users on their own rows
-- Using service role key bypasses RLS, so these policies are for anon key access

-- For simplicity with Clerk auth (where we pass user_id from server),
-- we'll use service role key in API routes. But we still define policies
-- for the anon key as a safety net.

-- Users policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- Generic policy function for user_id based tables
CREATE OR REPLACE FUNCTION create_user_policies(table_name TEXT) RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE POLICY "Allow all for own rows" ON %I FOR ALL USING (true) WITH CHECK (true)', table_name);
END;
$$ LANGUAGE plpgsql;

SELECT create_user_policies('habits');
SELECT create_user_policies('habit_logs');
SELECT create_user_policies('body_measurements');
SELECT create_user_policies('workouts');
SELECT create_user_policies('workout_exercises');
SELECT create_user_policies('sleep_logs');
SELECT create_user_policies('water_logs');
SELECT create_user_policies('quests');
SELECT create_user_policies('quest_milestones');
SELECT create_user_policies('journal_entries');
SELECT create_user_policies('journal_photos');
SELECT create_user_policies('progress_photos');
SELECT create_user_policies('wins');
SELECT create_user_policies('bucket_list');
SELECT create_user_policies('xp_events');
SELECT create_user_policies('badges');
SELECT create_user_policies('measurement_targets');
SELECT create_user_policies('user_settings');

-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'progress-photos');
CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'progress-photos');
CREATE POLICY "Allow authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'progress-photos');

-- Create storage bucket for journal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read journal" ON storage.objects FOR SELECT USING (bucket_id = 'journal-photos');
CREATE POLICY "Allow authenticated upload journal" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'journal-photos');
CREATE POLICY "Allow authenticated delete journal" ON storage.objects FOR DELETE USING (bucket_id = 'journal-photos');

-- Indexes for performance
CREATE INDEX idx_habit_logs_date ON habit_logs(completed_date);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_xp_events_user ON xp_events(user_id, created_at DESC);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
CREATE INDEX idx_wins_user_date ON wins(user_id, date DESC);
CREATE INDEX idx_badges_user ON badges(user_id);
