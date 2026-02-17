
import { createClient } from '@supabase/supabase-js';

// تم تصحيح الرابط من hvhguy إلى hvhgux بناءً على بياناتك الصحيحة
const supabaseUrl = 'https://hvhguxadrpstfjgufnnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aGd1eGFkcnBzdGZqZ3Vmbm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDY3MjQsImV4cCI6MjA4NjYyMjcyNH0.5c4CooVNSaA8sv4waQDMXnvvZZ0r975SoVe9CvhCQY8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
