import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId);

    if (date) query = query.eq('date', date);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const totalMl = (data || []).reduce((sum, log) => sum + log.amount_ml, 0);
    return NextResponse.json({ logs: data || [], totalMl });
  } catch (error) {
    console.error('Error fetching water logs:', error);
    return NextResponse.json({ error: 'Failed to fetch water logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: userId,
        date: body.date,
        amount_ml: body.amount_ml || 250,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding water log:', error);
    return NextResponse.json({ error: 'Failed to add water log' }, { status: 500 });
  }
}
