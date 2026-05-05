import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entryId = formData.get('entry_id') as string;

    if (!file || !entryId) {
      return NextResponse.json(
        { error: 'File and entry_id are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify entry belongs to user
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Upload to storage
    const fileName = `${entryId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('journal-photos')
      .upload(fileName, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Insert row in journal_photos
    const { data: photoData, error: photoError } = await supabase
      .from('journal_photos')
      .insert({
        entry_id: entryId,
        storage_path: uploadData.path,
      })
      .select()
      .single();

    if (photoError) throw photoError;
    return NextResponse.json(photoData);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get photo details
    const { data: photo, error: photoError } = await supabase
      .from('journal_photos')
      .select('storage_path, entry_id')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Verify user owns the entry
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', photo.entry_id)
      .single();

    if (entryError || entry?.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from('journal-photos')
      .remove([photo.storage_path]);

    if (deleteStorageError) throw deleteStorageError;

    // Delete from DB
    const { error: deleteDbError } = await supabase
      .from('journal_photos')
      .delete()
      .eq('id', photoId);

    if (deleteDbError) throw deleteDbError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
