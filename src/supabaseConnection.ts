import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config()


const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, {
    global: { fetch },
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export { supabase }