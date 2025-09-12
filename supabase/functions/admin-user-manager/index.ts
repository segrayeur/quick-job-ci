import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCandidatePayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
}

interface ResetPasswordPayload { email: string; new_password: string }
interface DeleteAccountPayload { email: string }

type Action =
  | { action: "create_candidate"; payload: CreateCandidatePayload }
  | { action: "reset_password"; payload: ResetPasswordPayload }
  | { action: "delete_account"; payload: DeleteAccountPayload };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header missing");
    const token = authHeader.replace("Bearer ", "");

    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await client.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Authentication failed");

    const service = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Check admin role
    const { data: adminRow, error: roleErr } = await service
      .from("users")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (roleErr) throw roleErr;
    if (!adminRow || adminRow.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Forbidden: admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json()) as Action;

    if (body.action === "create_candidate") {
      const p = body.payload;
      if (!p.email || !p.password) throw new Error("email and password are required");

      // Create auth user (confirmed)
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: p.email,
        password: p.password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      const newUserId = created.user?.id;
      if (!newUserId) throw new Error("Failed to create user");

      // Create profile
      const { error: profileErr } = await service.rpc("create_user_profile", {
        user_uuid: newUserId,
        user_email: p.email,
        user_role: "candidate",
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        phone: p.phone ?? null,
        location: p.location ?? null,
      });
      if (profileErr) throw profileErr;

      return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "reset_password") {
      const { email, new_password } = body.payload;
      if (!email || !new_password) throw new Error("email and new_password are required");

      // Find user by email
      const { data: list, error: listErr } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) throw listErr;
      const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("User not found");

      const { error: updErr } = await service.auth.admin.updateUserById(user.id, { password: new_password });
      if (updErr) throw updErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "delete_account") {
      const { email } = body.payload;
      if (!email) throw new Error("email is required");

      const { data: list, error: listErr } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) throw listErr;
      const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("User not found");

      const { error: delErr } = await service.auth.admin.deleteUser(user.id);
      if (delErr) throw delErr;

      // Optionally cleanup public.users row
      await service.from("users").delete().eq("email", email);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("admin-user-manager error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
