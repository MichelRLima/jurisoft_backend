import { createClient } from "@supabase/supabase-js";

/* const supabaseUrl = 'https://seu-projeto.supabase.co'
const supabaseKey = 'sua-chave-anon-public' */

const supabaseUrl = process.env.SUPERBASE_URL || "";
const supabaseKey = process.env.SUPERBASE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
