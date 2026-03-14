import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://seqiexfnngsntqfrkswc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AoDaAjiMTR09ZEJIZto8Hg_r9g3hz5r';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
