import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
import { CharacterStats } from '@/types';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    // Fetch all data needed for stats calculation
    const [workoutsRes, sleepRes, waterRes, habitLogsRes, habitsRes] = await Promise.all([
      supabase.from('workouts').select('type, duration').eq('user_id', userId),
      supabase.from('sleep_logs').select('hours, quality').eq('user_id', userId),
      supabase.from('water_logs').select('amount_ml').eq('user_id', userId),
      supabase.from('habit_logs').select('habit_id, completed_date').eq('user_id', userId),
      supabase.from('habits').select('id').eq('user_id', userId),
    ]);

    const workouts = workoutsRes.data || [];
    const sleepLogs = sleepRes.data || [];
    const waterLogs = waterRes.data || [];
    const habitLogs = habitLogsRes.data || [];

    // STR: based on workout count and total duration
    const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const str = Math.min(100, Math.round((totalWorkoutMinutes / 50) * 10));

    // VIT: based on sleep quality and water intake
    const avgSleepQuality = sleepLogs.length > 0
      ? sleepLogs.reduce((sum, s) => sum + (s.quality || 0), 0) / sleepLogs.length
      : 0;
    const totalWater = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0);
    const vit = Math.min(100, Math.round(
      (avgSleepQuality / 5) * 50 + Math.min(50, (totalWater / 100000) * 50)
    ));

    // INT: placeholder (no knowledge vault now)
    const int = Math.min(100, 10);

    // WIL: based on habit completion streaks
    const habitDates = new Set(habitLogs.map(l => l.completed_date));
    const wil = Math.min(100, Math.round((habitDates.size / 30) * 50));

    // AGI: based on cardio/mobility workouts
    const agiWorkouts = workouts.filter(w =>
      ['Cardio', 'Mobility', 'HIIT', 'Sports'].includes(w.type)
    );
    const agiMinutes = agiWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const agi = Math.min(100, Math.round((agiMinutes / 30) * 10));

    const stats: CharacterStats = { str, vit, int, wil, agi };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json({ str: 0, vit: 0, int: 0, wil: 0, agi: 0 });
  }
}
