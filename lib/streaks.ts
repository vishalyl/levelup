import { format, subDays, eachDayOfInterval, startOfWeek, parseISO, startOfDay } from 'date-fns';
import type { HabitLog } from '@/types';

export function calculateStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter(l => l.habit_id === habitId).map(l => l.completed_date).sort().reverse();
  if (!habitLogs.length) return 0;
  let streak = 0;
  let checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (habitLogs.includes(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (i === 0) {
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getHeatmapData(habitId: string, logs: HabitLog[]) {
  const logDates = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.completed_date));
  return eachDayOfInterval({ start: subDays(new Date(), 364), end: new Date() }).map(day => ({
    date: format(day, 'yyyy-MM-dd'),
    done: logDates.has(format(day, 'yyyy-MM-dd')),
  }));
}

export function getRecentHeatmapData(habitId: string, logs: HabitLog[], days: number = 30) {
  const logDates = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.completed_date));
  return eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() }).map(day => ({
    date: format(day, 'yyyy-MM-dd'),
    done: logDates.has(format(day, 'yyyy-MM-dd')),
  }));
}

export function getWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getWeekDays(): string[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => format(subDays(weekStart, -i), 'yyyy-MM-dd'));
}
