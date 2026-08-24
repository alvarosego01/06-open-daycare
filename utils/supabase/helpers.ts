import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserDaycareId(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase.rpc('get_current_user_daycare_id');

  if (error) {
    console.error('Error fetching daycare_id via RPC:', error);
    throw new Error(`Failed to fetch daycare_id: ${error.message}`);
  }

  if (!data) {
    throw new Error('User does not have a daycare_id assigned');
  }

  return data;
}
