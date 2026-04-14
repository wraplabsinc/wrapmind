const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = { supabaseAdmin, supabaseAnon };
