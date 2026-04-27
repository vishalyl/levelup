export interface User {
  id: string;
  clerk_id: string;
  character_name: string;
  height_cm: number | null;
  preferred_units: 'metric' | 'imperial';
  timezone: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  category: 'Body' | 'Mind' | 'Soul' | 'Work';
  frequency: 'daily' | 'weekdays' | 'custom';
  custom_days: number[];
  color: string;
  grace_day: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  waist: number | null;
  chest: number | null;
  left_arm: number | null;
  right_arm: number | null;
  hips: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  neck: number | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  type: 'Strength' | 'Cardio' | 'HIIT' | 'Yoga' | 'Mobility' | 'Sports' | 'Other';
  duration: number;
  intensity: number;
  notes: string | null;
  created_at: string;
  exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  hours: number | null;
  quality: number;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface Quest {
  id: string;
  user_id: string;
  name: string;
  month: number;
  year: number;
  description: string | null;
  color: string;
  status: 'active' | 'completed' | 'abandoned';
  completed_at: string | null;
  created_at: string;
  milestones?: QuestMilestone[];
}

export interface QuestMilestone {
  id: string;
  quest_id: string;
  title: string;
  xp_reward: number;
  completed_at: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  mood: 'amazing' | 'good' | 'okay' | 'rough' | 'terrible';
  content: string | null;
  tags: string[];
  created_at: string;
  photos?: JournalPhoto[];
}

export interface JournalPhoto {
  id: string;
  entry_id: string;
  storage_path: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  notes: string | null;
  category: 'Front' | 'Side' | 'Back' | 'Other';
  storage_path: string;
  created_at: string;
}

export interface Win {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'Fitness' | 'Mental' | 'Career' | 'Social' | 'Personal';
  date: string;
  importance: number;
  created_at: string;
}

export interface BucketListItem {
  id: string;
  user_id: string;
  title: string;
  category: 'Travel' | 'Experience' | 'Skill' | 'Achievement' | 'Other';
  description: string | null;
  target_date: string | null;
  priority: 'low' | 'medium' | 'high';
  completed_at: string | null;
  completion_notes: string | null;
  completion_photo_path: string | null;
  created_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_key: string;
  unlocked_at: string;
}

export interface CharacterStats {
  str: number;
  vit: number;
  int: number;
  wil: number;
  agi: number;
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  hidden?: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  interval_days: number;
  next_due_at: string;
  last_completed_at: string | null;
  snooze_count: number;
  created_at: string;
}

export interface MeasurementTarget {
  id: string;
  user_id: string;
  measurement_type: string;
  target_value: number;
}

export interface Reward {
  id: string;
  title: string;
  milestone: number;
  claimed: boolean;
}
