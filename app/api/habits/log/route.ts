import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habit_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);

    if (habitId) query = query.eq('habit_id', habitId);
    if (startDate) query = query.gte('completed_date', startDate);
    if (endDate) query = query.lte('completed_date', endDate);

    const { data, error } = await query.order('completed_date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch habit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { habit_id, completed_date } = await request.json();
    const supabase = getServiceSupabase();

    // Check if already logged
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habit_id)
      .eq('completed_date', completed_date)
      .single();

    if (existing) {
      // Remove the log (toggle off)
      await supabase.from('habit_logs').delete().eq('id', existing.id);
      return NextResponse.json({ action: 'removed' });
    }

    // Add the log
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({ habit_id, user_id: userId, completed_date })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ action: 'added', data });
  } catch (error) {
    console.error('Error toggling habit log:', error);
    return NextResponse.json({ error: 'Failed to toggle habit log' }, { status: 500 });
  }
}
