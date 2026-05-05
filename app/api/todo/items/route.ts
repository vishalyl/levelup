import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');
    const includeCompleted = searchParams.get('include_completed') === 'true';

    const supabase = getServiceSupabase();
    let query = supabase
      .from('todo_items')
      .select('*')
      .eq('user_id', userId);

    if (listId) {
      query = query.eq('list_id', listId);
    }

    if (includeCompleted) {
      query = query.order('completed_at', { ascending: false, nullsFirst: true });
    } else {
      query = query.is('completed_at', null).order('sort_order', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET /api/todo/items error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { list_id, title, notes = '', due_date = null } = body;

    if (!list_id || !title) {
      return NextResponse.json({ error: 'list_id and title required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: items, error: countError } = await supabase
      .from('todo_items')
      .select('id', { count: 'exact' })
      .eq('list_id', list_id);

    if (countError) throw countError;

    const { data, error } = await supabase
      .from('todo_items')
      .insert([
        {
          list_id,
          user_id: userId,
          title,
          notes: notes || null,
          due_date,
          sort_order: (items?.length || 0) * 10,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('POST /api/todo/items error:', error);
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { id, title, notes, due_date, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (notes !== undefined) updates.notes = notes || null;
    if (due_date !== undefined) updates.due_date = due_date;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('todo_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/todo/items error:', error);
    throw error;
  }
}
