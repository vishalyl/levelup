import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
import { getLevelFromXP } from '@/lib/levels';
import type { QuestPrerequisite } from '@/types';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const [questsResult, xpResult] = await Promise.all([
      supabase
        .from('quests')
        .select('*, milestones:quest_milestones(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', userId),
    ]);

    if (questsResult.error) throw questsResult.error;

    const totalXP = (xpResult.data || []).reduce((sum, e) => sum + e.amount, 0);
    const userLevel = getLevelFromXP(totalXP);
    const completedQuestIds = new Set(
      (questsResult.data || [])
        .filter(q => q.status === 'completed')
        .map(q => q.id)
    );

    const quests = (questsResult.data || []).map(quest => ({
      ...quest,
      prerequisites: (quest.prerequisites || []).map((prereq: QuestPrerequisite) => {
        let fulfilled = false;
        if (prereq.type === 'level') {
          fulfilled = userLevel >= (prereq.min_level || 1);
        } else if (prereq.type === 'quest_complete') {
          fulfilled = prereq.quest_id ? completedQuestIds.has(prereq.quest_id) : false;
        }
        // text and habit_streak remain unfulfilled until manually checked
        return { ...prereq, fulfilled };
      }),
    }));

    return NextResponse.json(quests);
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
        frequency: body.frequency || 'one-time',
        due_date: body.due_date || null,
        prerequisites: body.prerequisites || [],
        partner_name: body.partner_name || null,
      })
      .select('*, milestones:quest_milestones(*)')
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

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (body.status === 'active') {
        updateData.completed_at = null;
      }
    }

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.prerequisites !== undefined) updateData.prerequisites = body.prerequisites;
    if (body.partner_name !== undefined) updateData.partner_name = body.partner_name || null;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('quests')
      .update(updateData)
      .eq('id', body.id)
      .select('*, milestones:quest_milestones(*)')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating quest:', error);
    return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('id');
    const supabase = getServiceSupabase();

    if (!questId) {
      return NextResponse.json({ error: 'Quest ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quest:', error);
    return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 });
  }
}
