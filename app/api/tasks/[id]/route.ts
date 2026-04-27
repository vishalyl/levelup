import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceSupabase();
    const today = format(new Date(), 'yyyy-MM-dd');

    if (body.action === 'complete') {
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('interval_days, next_due_at')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const nextDueAt = format(addDays(new Date(), task.interval_days), 'yyyy-MM-dd');
      const daysOverdue = differenceInDays(parseISO(today), parseISO(task.next_due_at));
      const wasOnTime = daysOverdue <= 0;

      const { error } = await supabase
        .from('tasks')
        .update({ last_completed_at: today, next_due_at: nextDueAt, snooze_count: 0 })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, wasOnTime });
    }

    if (body.action === 'snooze') {
      const { data: task, error: fetchError } = await supabase
        .from('tasks').select('snooze_count').eq('id', id).single();
      if (fetchError) throw fetchError;
      const { error } = await supabase
        .from('tasks')
        .update({ next_due_at: format(addDays(new Date(), 2), 'yyyy-MM-dd'), snooze_count: (task.snooze_count || 0) + 1 })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
