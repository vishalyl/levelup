import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('next_due_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: body.title,
        emoji: body.emoji || '📋',
        interval_days: body.interval_days || 14,
        next_due_at: format(new Date(), 'yyyy-MM-dd'),
        snooze_count: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
