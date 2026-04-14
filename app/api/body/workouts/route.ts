import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('workouts')
      .select('*, exercises:workout_exercises(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        date: body.date,
        type: body.type,
        duration: body.duration,
        intensity: body.intensity,
        notes: body.notes,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    if (body.exercises && body.exercises.length > 0) {
      const exercises = body.exercises.map((ex: { name: string; sets: number; reps: number; weight: number }) => ({
        workout_id: workout.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
      }));

      await supabase.from('workout_exercises').insert(exercises);
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error adding workout:', error);
    return NextResponse.json({ error: 'Failed to add workout' }, { status: 500 });
  }
}
