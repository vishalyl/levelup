import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';
import type { TodoList } from '@/types';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data: lists, error: listsError } = await supabase
      .from('todo_lists')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (listsError) throw listsError;

    const { data: items, error: itemsError } = await supabase
      .from('todo_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (itemsError) throw itemsError;

    const listMap = new Map<string, TodoList>(
      (lists || []).map((list) => [
        list.id,
        { ...list, items: [] },
      ])
    );

    (items || []).forEach((item) => {
      const list = listMap.get(item.list_id);
      if (list) {
        list.items!.push(item);
      }
    });

    return NextResponse.json(Array.from(listMap.values()));
  } catch (error) {
    console.error('GET /api/todo error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { name, icon = '📋', color = '#7C3AED' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: listCount, error: countError } = await supabase
      .from('todo_lists')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (countError) throw countError;

    const { data, error } = await supabase
      .from('todo_lists')
      .insert([
        {
          user_id: userId,
          name,
          icon,
          color,
          sort_order: (listCount?.length || 0) * 10,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, items: [] });
  } catch (error) {
    console.error('POST /api/todo error:', error);
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { id, name, icon, color, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('todo_lists')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/todo error:', error);
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');

    if (!listId) {
      return NextResponse.json({ error: 'list_id required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: list, error: listError } = await supabase
      .from('todo_lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError || !list || list.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('todo_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/todo error:', error);
    throw error;
  }
}
