// Copy this file to environment.ts and environment.prod.ts
// Replace the placeholder values with your actual Supabase credentials
import { version } from '../../package.json';

export const environment = {
  production: false,
  version,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
