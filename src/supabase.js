import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgkkdqtjjyhjbcmocmwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNna2tkcXRqanloamJjbW9jbXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMjAwNjEsImV4cCI6MjA5OTg5NjA2MX0.bMhRdIgYuv1p8lo9mo6MlqN2aiM3r0iOk1Ku9swhz1E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);