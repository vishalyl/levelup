import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('wins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching wins:', error);
    return NextResponse.json({ error: 'Failed to fetch wins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('wins')
      .insert({
        user_id: userId,
        title: body.title,
        description: body.description,
        category: body.category,
        date: body.date,
        importance: body.importance || 1,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating win:', error);
    return NextResponse.json({ error: 'Failed to create win' }, { status: 500 });
  }
}
