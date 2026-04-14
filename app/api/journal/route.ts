import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    if (mood) query = query.eq('mood', mood);
    if (tag) query = query.contains('tags', [tag]);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        date: body.date,
        title: body.title,
        mood: body.mood,
        content: body.content,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        title: body.title,
        mood: body.mood,
        content: body.content,
        tags: body.tags,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
