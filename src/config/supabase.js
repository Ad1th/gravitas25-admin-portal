const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('FATAL: SUPABASE_URL is not set in .env. ');
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error('FATAL: SUPABASE_ANON_KEY is not set in .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
