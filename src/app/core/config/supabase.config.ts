import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// 🔧 CONFIGURACIÓN DE SUPABASE
// Las credenciales se cargan desde variables de entorno (.env.local)
const SUPABASE_URL = environment.supabase.url;
const SUPABASE_ANON_KEY = environment.supabase.anonKey;

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
