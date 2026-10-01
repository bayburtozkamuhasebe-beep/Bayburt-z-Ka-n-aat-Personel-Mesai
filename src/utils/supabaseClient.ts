import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://mgtunrfpzbyfnmeloeeq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndHVucmZwemJ5Zm5tZWxvZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDUwMjgsImV4cCI6MjEwNDcyMTAyOH0.HcdwZbO-oHXQxytE-G221_62irBwuv0-8e3P_ux4a7k';

export interface MesaiRow {
  id?: string;
  adi_soyadi: string;
  gorevi: string;
  donem: string;
  santiyesi: string;
  durumu: string;
  [dayKey: string]: any;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
