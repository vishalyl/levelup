import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(habits || []);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name: body.name,
        emoji: body.emoji || '⭐',
        category: body.category,
        frequency: body.frequency || 'daily',
        custom_days: body.custom_days || [],
        color: body.color || '#7C3AED',
        grace_day: body.grace_day || false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('habits')
      .update({
        name: body.name,
        emoji: body.emoji,
        category: body.category,
        frequency: body.frequency,
        custom_days: body.custom_days,
        color: body.color,
        grace_day: body.grace_day,
        is_archived: body.is_archived,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}
