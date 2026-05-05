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
        tummy: body.tummy,
        waist: body.waist,
        chest: body.chest,
        neck: body.neck,
        shoulder: body.shoulder,
        left_biceps: body.left_biceps,
        right_biceps: body.right_biceps,
        left_forearm: body.left_forearm,
        right_forearm: body.right_forearm,
        left_thigh: body.left_thigh,
        right_thigh: body.right_thigh,
        left_calf: body.left_calf,
        right_calf: body.right_calf,
        hips: body.hips,
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
