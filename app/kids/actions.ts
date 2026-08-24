'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getUserDaycareId } from '@/utils/supabase/helpers';
import { revalidatePath } from 'next/cache';

export async function getRooms() {
  const supabase = createClient(await cookies());
  const daycareId = await getUserDaycareId(supabase);

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('daycare_id', daycareId)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch rooms: ${error.message}`);
  }

  return data;
}

export async function getChildren() {
  const supabase = createClient(await cookies());
  const daycareId = await getUserDaycareId(supabase);

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('daycare_id', daycareId);

  const roomIds = rooms?.map(r => r.id) || [];

  const { data, error } = await supabase
    .from('children')
    .select(`
      id,
      full_name,
      birth_date,
      enrolled_at,
      medical_notes,
      allergy_tags,
      photo_consent,
      room_id
    `)
    .eq('status', 'active')
    .in('room_id', roomIds)
    .order('room_id')
    .order('full_name');

  if (error) {
    throw new Error(`Failed to fetch children: ${error.message}`);
  }

  const roomMap = new Map(rooms?.map(r => [r.id, r.name]) || []);

  return data.map(child => ({
    id: child.id,
    full_name: child.full_name,
    birth_date: child.birth_date,
    enrolled_at: child.enrolled_at,
    medical_notes: child.medical_notes,
    allergy_tags: child.allergy_tags,
    photo_consent: child.photo_consent,
    room_id: child.room_id,
    room_name: roomMap.get(child.room_id) || 'Unknown'
  }));
}

export async function addChild(formData: FormData) {
  const supabase = createClient(await cookies());

  try {
    const fullName = formData.get('full_name') as string;
    const birthDateRaw = formData.get('birth_date') as string;
    const roomId = formData.get('room_id') as string;
    const allergyTagsRaw = formData.get('allergy_tags') as string;
    const medicalNotes = formData.get('medical_notes') as string;

    const [day, month, year] = birthDateRaw.split('/');
    const birthDate = `${year}-${month}-${day}`;

    const allergyTags = allergyTagsRaw
      ? allergyTagsRaw.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
      : [];

    const { error } = await supabase
      .from('children')
      .insert({
        full_name: fullName,
        birth_date: birthDate,
        room_id: roomId,
        allergy_tags: allergyTags,
        medical_notes: medicalNotes || null,
        status: 'active'
      });

    if (error) {
      return { error: `Failed to add child: ${error.message}` };
    }

    revalidatePath('/kids');
    return { success: true };
  } catch (err) {
    return { error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function archiveChild(childId: string) {
  const supabase = createClient(await cookies());

  try {
    const { error } = await supabase
      .from('children')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', childId);

    if (error) {
      return { error: `Failed to archive child: ${error.message}` };
    }

    revalidatePath('/kids');
    return { success: true };
  } catch (err) {
    return { error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function getChildById(id: string) {
  const supabase = createClient(await cookies());
  const daycareId = await getUserDaycareId(supabase);

  const { data: child, error } = await supabase
    .from('children')
    .select(`
      id,
      full_name,
      birth_date,
      enrolled_at,
      medical_notes,
      allergy_tags,
      photo_consent,
      status,
      room_id
    `)
    .eq('id', id)
    .single();

  if (error || !child) {
    return null;
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, name, daycare_id')
    .eq('id', child.room_id)
    .single();

  if (!room || room.daycare_id !== daycareId) {
    return null;
  }

  return {
    id: child.id,
    full_name: child.full_name,
    birth_date: child.birth_date,
    enrolled_at: child.enrolled_at,
    medical_notes: child.medical_notes,
    allergy_tags: child.allergy_tags,
    photo_consent: child.photo_consent,
    status: child.status,
    room_id: child.room_id,
    room_name: room.name
  };
}
