import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getOrCreateUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('users')
      .update({
        character_name: body.character_name,
        height_cm: body.height_cm,
        preferred_units: body.preferred_units,
        timezone: body.timezone,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
