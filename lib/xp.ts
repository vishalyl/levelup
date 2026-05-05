export const XP_VALUES = {
  HABIT_COMPLETE: 15,
  PERFECT_DAY: 50,
  WORKOUT_LOGGED: 30,
  JOURNAL_ENTRY: 20,
  PROGRESS_PHOTO: 25,
  QUEST_MILESTONE: 150,
  MEASUREMENT_LOGGED: 10,
  WINS_ENTRY: 20,
  BUCKET_LIST_DONE: 100,
  STREAK_7_DAY: 75,
  STREAK_30_DAY: 300,
  TASK_COMPLETE: 25,
  TASK_COMPLETE_ONTIME: 10,
  TODO_ITEM_COMPLETE: 10,
  TODO_ITEM_ONTIME: 15,
  TODO_LIST_CLEARED: 40,
  TODO_OVERDUE_RESCUED: 20,
  TODO_SPEEDRUN: 25,
} as const;

export type XPReason =
  | 'habit_complete'
  | 'perfect_day'
  | 'workout_logged'
  | 'journal_entry'
  | 'progress_photo'
  | 'quest_milestone'
  | 'measurement_logged'
  | 'wins_entry'
  | 'bucket_list_done'
  | 'streak_7_day'
  | 'streak_30_day'
  | 'task_complete'
  | 'task_complete_ontime'
  | 'todo_item_complete'
  | 'todo_item_ontime'
  | 'todo_list_cleared'
  | 'todo_overdue_rescued'
  | 'todo_speedrun';

export function getXPAmount(reason: XPReason): number {
  const map: Record<XPReason, number> = {
    habit_complete: XP_VALUES.HABIT_COMPLETE,
    perfect_day: XP_VALUES.PERFECT_DAY,
    workout_logged: XP_VALUES.WORKOUT_LOGGED,
    journal_entry: XP_VALUES.JOURNAL_ENTRY,
    progress_photo: XP_VALUES.PROGRESS_PHOTO,
    quest_milestone: XP_VALUES.QUEST_MILESTONE,
    measurement_logged: XP_VALUES.MEASUREMENT_LOGGED,
    wins_entry: XP_VALUES.WINS_ENTRY,
    bucket_list_done: XP_VALUES.BUCKET_LIST_DONE,
    streak_7_day: XP_VALUES.STREAK_7_DAY,
    streak_30_day: XP_VALUES.STREAK_30_DAY,
    task_complete: XP_VALUES.TASK_COMPLETE,
    task_complete_ontime: XP_VALUES.TASK_COMPLETE_ONTIME,
    todo_item_complete: XP_VALUES.TODO_ITEM_COMPLETE,
    todo_item_ontime: XP_VALUES.TODO_ITEM_ONTIME,
    todo_list_cleared: XP_VALUES.TODO_LIST_CLEARED,
    todo_overdue_rescued: XP_VALUES.TODO_OVERDUE_RESCUED,
    todo_speedrun: XP_VALUES.TODO_SPEEDRUN,
  };
  return map[reason];
}

export function getXPLabel(reason: string): string {
  const labels: Record<string, string> = {
    habit_complete: 'Habit Completed',
    perfect_day: 'Perfect Day!',
    workout_logged: 'Workout Logged',
    journal_entry: 'Journal Entry',
    progress_photo: 'Progress Photo',
    quest_milestone: 'Quest Milestone',
    measurement_logged: 'Measurement Logged',
    wins_entry: 'Win Logged',
    bucket_list_done: 'Bucket List Item',
    streak_7_day: '7-Day Streak!',
    streak_30_day: '30-Day Streak!',
    task_complete: 'Task Complete',
    task_complete_ontime: 'On-Time Bonus!',
    todo_item_complete: 'Objective Complete!',
    todo_item_ontime: 'On-Time Bonus!',
    todo_list_cleared: 'List Cleared!',
    todo_overdue_rescued: 'Overdue Rescued!',
    todo_speedrun: 'Speedrun Bonus!',
  };
  return labels[reason] || reason;
}
