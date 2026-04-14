import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('quests')
      .select('*, milestones:quest_milestones(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('quests')
      .insert({
        user_id: userId,
        name: body.name,
        month: body.month,
        year: body.year,
        description: body.description,
        color: body.color || 'linear-gradient(135deg, #7C3AED, #06B6D4)',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating quest:', error);
    return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const updateData: Record<string, unknown> = { status: body.status };
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('quests')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating quest:', error);
    return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 });
  }
}
