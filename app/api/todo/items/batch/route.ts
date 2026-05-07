import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { list_id, items } = body;

    if (!list_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'list_id and items array required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: itemCount, error: countError } = await supabase
      .from('todo_items')
      .select('id', { count: 'exact' })
      .eq('list_id', list_id);

    if (countError) throw countError;

    const newItems = items.map((item, idx) => ({
      list_id,
      user_id: userId,
      title: item.title.trim(),
      notes: item.notes || null,
      due_date: item.due_date || null,
      sort_order: (itemCount?.length || 0 + idx) * 10,
    }));

    const { data, error } = await supabase
      .from('todo_items')
      .insert(newItems)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('POST /api/todo/items/batch error:', error);
    throw error;
  }
}
