// This file is kept for backward compatibility with existing imports.
// It re-exports the centralized client from src/lib/supabase.ts to ensure a single instance.
import { supabase } from "@/lib/supabase";
export { supabase };