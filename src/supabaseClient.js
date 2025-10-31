import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xfnpvgvmjmcwtidtjxgy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmbnB2Z3Ztam1jd3RpZHRqeGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTU4NjYsImV4cCI6MjA3NzM5MTg2Nn0.cCNYTHALWCLYxnR59FsMQAp_R94uD40H5c8QgBGM7oc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
