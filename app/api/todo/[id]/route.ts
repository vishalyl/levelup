import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
import { todayString } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();
    const { completed } = body;

    const supabase = getServiceSupabase();

    const { data: item, error: itemError } = await supabase
      .from('todo_items')
      .select('*, list_id, due_date')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (itemError) throw itemError;
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const completedAt = completed ? new Date().toISOString() : null;

    const { data: updatedItem, error: updateError } = await supabase
      .from('todo_items')
      .update({ completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    let wasOnTime = false;
    let wasOverdue = false;

    if (completed && item.due_date) {
      const today = todayString();
      const dueDateObj = parseISO(item.due_date);
      const todayObj = parseISO(today);
      const daysDiff = differenceInDays(todayObj, dueDateObj);

      wasOnTime = daysDiff <= 0;
      wasOverdue = daysDiff >= 3;
    }

    const { data: activeItems, error: activeError } = await supabase
      .from('todo_items')
      .select('id', { count: 'exact' })
      .eq('list_id', item.list_id)
      .is('completed_at', null);

    if (activeError) throw activeError;

    const listNowCleared = completed && (activeItems?.length === 0);

    const today = todayString();
    const { data: completedToday, error: todayError } = await supabase
      .from('todo_items')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('completed_at', `${today}T00:00:00`);

    if (todayError) throw todayError;

    const completedTodayCount = completed ? (completedToday?.length || 0) : 0;

    return NextResponse.json({
      item: updatedItem,
      wasOnTime,
      wasOverdue,
      listNowCleared,
      completedTodayCount,
    });
  } catch (error) {
    console.error('PATCH /api/todo/[id] error:', error);
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/todo/[id] error:', error);
    throw error;
  }
}
