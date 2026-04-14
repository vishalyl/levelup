import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { badge_key } = await request.json();
    const supabase = getServiceSupabase();

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_key', badge_key)
      .single();

    if (existing) {
      return NextResponse.json({ already_unlocked: true });
    }

    const { data, error } = await supabase
      .from('badges')
      .insert({ user_id: userId, badge_key })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error unlocking badge:', error);
    return NextResponse.json({ error: 'Failed to unlock badge' }, { status: 500 });
  }
}
