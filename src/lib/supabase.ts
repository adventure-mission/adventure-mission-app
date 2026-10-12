import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yhjbimebclhxlkqtgupy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloamJpbWViY2xoeGxrcXRndXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzkzNjYsImV4cCI6MjA5NDQ1NTM2Nn0.jbtSGgjxf5p09VT6eUa9GjOSoD-3z0cJh2M3U6YYfYo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
