import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const supabase = getServiceSupabase();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const date = formData.get('date') as string;
    const weight = formData.get('weight') as string;
    const notes = formData.get('notes') as string;
    const category = formData.get('category') as string;

    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: userId,
        date,
        weight: weight ? parseFloat(weight) : null,
        notes: notes || null,
        category: category || 'Front',
        storage_path: fileName,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
