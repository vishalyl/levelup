import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: userId,
        date: body.date,
        weight: body.weight,
        body_fat: body.body_fat,
        waist: body.waist,
        chest: body.chest,
        left_arm: body.left_arm,
        right_arm: body.right_arm,
        hips: body.hips,
        left_thigh: body.left_thigh,
        right_thigh: body.right_thigh,
        neck: body.neck,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding measurement:', error);
    return NextResponse.json({ error: 'Failed to add measurement' }, { status: 500 });
  }
}
