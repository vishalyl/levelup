import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('bucket_list')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching bucket list:', error);
    return NextResponse.json({ error: 'Failed to fetch bucket list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('bucket_list')
      .insert({
        user_id: userId,
        title: body.title,
        category: body.category,
        description: body.description,
        target_date: body.target_date,
        priority: body.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating bucket list item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const updateData: Record<string, unknown> = {};

    if (body.completed !== undefined) {
      updateData.completed_at = body.completed ? new Date().toISOString() : null;
      updateData.completion_notes = body.completion_notes || null;
    }

    if (body.title) updateData.title = body.title;
    if (body.category) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.target_date !== undefined) updateData.target_date = body.target_date;
    if (body.priority) updateData.priority = body.priority;

    const { data, error } = await supabase
      .from('bucket_list')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bucket list item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
