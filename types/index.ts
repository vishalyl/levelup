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
  tummy: number | null;
  waist: number | null;
  chest: number | null;
  neck: number | null;
  shoulder: number | null;
  left_biceps: number | null;
  right_biceps: number | null;
  left_forearm: number | null;
  right_forearm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  left_calf: number | null;
  right_calf: number | null;
  hips: number | null;
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

export interface QuestPrerequisite {
  type: 'text' | 'level' | 'habit_streak' | 'quest_complete';
  text?: string;
  min_level?: number;
  habit_id?: string;
  habit_name?: string;
  min_streak?: number;
  quest_id?: string;
  quest_name?: string;
  fulfilled?: boolean;
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
  frequency: 'one-time' | 'weekly' | 'monthly' | 'partner';
  due_date: string | null;
  partner_name: string | null;
  prerequisites: QuestPrerequisite[];
  completed_at: string | null;
  updated_at: string;
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
  template_type: 'free' | 'gratitude' | 'reflection' | 'goals';
  word_count: number;
  updated_at: string;
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

export interface GoalSubgoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalReward {
  id: string;
  title: string;
  milestone: number;
  claimed: boolean;
}

export interface GoalRule {
  id: string;
  text: string;
}

export interface GoalLog {
  id: string;
  amount: number;
  date: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  current: number;
  target: number;
  unit: string;
  colorIdx: number;
  subgoals: GoalSubgoal[];
  rewards: GoalReward[];
  rules: GoalRule[];
  logs: GoalLog[];
  created_at: string;
}

export interface TodoList {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items?: TodoItem[];
}

export interface TodoItem {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TodoUrgency = 'none' | 'upcoming' | 'today' | 'overdue' | 'critical';
