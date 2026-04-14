import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    return NextResponse.json({ error: 'Failed to fetch sleep logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('sleep_logs')
      .insert({
        user_id: userId,
        date: body.date,
        bedtime: body.bedtime,
        wake_time: body.wake_time,
        hours: body.hours,
        quality: body.quality,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding sleep log:', error);
    return NextResponse.json({ error: 'Failed to add sleep log' }, { status: 500 });
  }
}
