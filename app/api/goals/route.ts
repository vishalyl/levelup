import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

function transformGoal(goal: any) {
  return {
    ...goal,
    colorIdx: goal.color_idx,
  };
}

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(transformGoal));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    console.log('Creating goal for user:', userId);
    console.log('Goal data:', { title: body.title, target: body.target, unit: body.unit });

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        title: body.title,
        emoji: body.emoji,
        current: body.current || 0,
        target: body.target,
        unit: body.unit,
        color_idx: body.colorIdx || 0,
        subgoals: body.subgoals || [],
        rewards: body.rewards || [],
        rules: body.rules || [],
        logs: body.logs || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Goal created successfully:', data.id);
    return NextResponse.json(transformGoal(data));
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('goals')
      .update({
        title: body.title,
        emoji: body.emoji,
        current: body.current,
        target: body.target,
        unit: body.unit,
        color_idx: body.colorIdx,
        subgoals: body.subgoals || [],
        rewards: body.rewards || [],
        rules: body.rules || [],
        logs: body.logs || [],
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return NextResponse.json(transformGoal(data));
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const supabase = getServiceSupabase();

    if (!id) throw new Error('Goal ID is required');

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
