import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('quest_milestones')
      .insert({
        quest_id: body.quest_id,
        title: body.title,
        xp_reward: body.xp_reward || 150,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const updateData: Record<string, unknown> = {};

    if (body.completed !== undefined) {
      updateData.completed_at = body.completed ? new Date().toISOString() : null;
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.xp_reward !== undefined) updateData.xp_reward = body.xp_reward;

    const { data, error } = await supabase
      .from('quest_milestones')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('id');
    const supabase = getServiceSupabase();

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('quest_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
