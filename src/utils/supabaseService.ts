import { supabase, MesaiRow } from './supabaseClient';

export const fetchMesaiFromSupabase = async (donemFilter?: string): Promise<{ data: MesaiRow[]; error: string | null }> => {
  try {
    let query = supabase.from('mesai').select('*').order('adi_soyadi', { ascending: true });
    
    if (donemFilter && donemFilter !== 'all') {
      query = query.eq('donem', donemFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as MesaiRow[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Supabase bağlantı hatası' };
  }
};

export const insertMesaiToSupabase = async (row: Omit<MesaiRow, 'id'>): Promise<{ data: MesaiRow | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('mesai')
      .insert([row])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as MesaiRow, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Kayıt eklenemedi' };
  }
};

export const updateMesaiCellInSupabase = async (
  id: string,
  dayColumn: string,
  value: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('mesai')
      .update({ [dayColumn]: value, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Hücre güncellenemedi' };
  }
};

export const updateMesaiRowInSupabase = async (
  id: string,
  partial: Partial<MesaiRow>
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('mesai')
      .update({ ...partial, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Satır güncellenemedi' };
  }
};

export const deleteMesaiFromSupabase = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from('mesai').delete().eq('id', id);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Kayıt silinemedi' };
  }
};

export const updateMultipleRowsDurumuInSupabase = async (
  ids: string[],
  durumu: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('mesai')
      .update({ durumu, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Toplu durum güncellenemedi' };
  }
};

export const resetHoursForMultipleRowsInSupabase = async (
  ids: string[]
): Promise<{ error: string | null }> => {
  try {
    const resetPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      toplam_gun: 0,
      toplam_mesai: 0,
      toplam_hakedis: 0,
      net_odenecek: 0,
    };
    for (let d = 1; d <= 31; d++) {
      resetPayload[String(d)] = '';
    }

    const { error } = await supabase
      .from('mesai')
      .update(resetPayload)
      .in('id', ids);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Saatler sıfırlanamadı' };
  }
};
