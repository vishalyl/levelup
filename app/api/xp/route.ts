import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data: events } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const totalXP = (events || []).reduce((sum, e) => sum + e.amount, 0);
    const recentEvents = (events || []).slice(0, 10);

    return NextResponse.json({ totalXP, recentEvents, allEvents: events || [] });
  } catch (error) {
    console.error('Error fetching XP:', error);
    return NextResponse.json({ error: 'Failed to fetch XP' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { amount, reason } = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('xp_events')
      .insert({ user_id: userId, amount, reason })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding XP:', error);
    return NextResponse.json({ error: 'Failed to add XP' }, { status: 500 });
  }
}
