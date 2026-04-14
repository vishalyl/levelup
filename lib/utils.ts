import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning, warrior';
  if (hour < 17) return 'Keep pushing forward';
  if (hour < 21) return 'Strong evening ahead';
  return 'Rest well, champion';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    amazing: '🤩',
    good: '😊',
    okay: '😐',
    rough: '😔',
    terrible: '😢',
  };
  return map[mood] || '😐';
}

export function getMoodColor(mood: string): string {
  const map: Record<string, string> = {
    amazing: '#10B981',
    good: '#06B6D4',
    okay: '#F59E0B',
    rough: '#EF4444',
    terrible: '#991B1B',
  };
  return map[mood] || '#F59E0B';
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
