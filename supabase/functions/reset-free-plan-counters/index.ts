import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Fetch all users on the 'free' plan
    const { data: freeUsers, error: usersError } = await supabaseClient
      .from('users')
      .select('user_id, email, first_name')
      .eq('subscription_plan', 'free');

    if (usersError) throw usersError;

    if (!freeUsers || freeUsers.length === 0) {
      console.log("No users on the free plan to reset.");
      return new Response(JSON.stringify({ message: "No users on the free plan to reset." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const userIds = freeUsers.map(user => user.user_id);

    // 2. Reset their counters
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        applications_created_count: 0,
        jobs_published: 0
      })
      .in('user_id', userIds);

    if (updateError) throw updateError;

    // 3. Send notification email to each user (optional, but good practice)
    for (const user of freeUsers) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'notification@lemplacement.com',
                to: user.email,
                subject: 'Votre forfait gratuit a été réinitialisé',
                html: `
                    <h1>Bonjour ${user.first_name},</h1>
                    <p>Bonne nouvelle ! Votre quota mensuel pour le plan gratuit a été réinitialisé.</p>
                    <p>Vous pouvez de nouveau postuler à des offres et/ou publier des annonces, selon votre rôle.</p>
                    <p>Connectez-vous à votre tableau de bord pour en profiter.</p>
                    <p>L\'équipe Le Mplacement</p>
                `,
            }),
        });
    }

    console.log(`Successfully reset counters for ${freeUsers.length} users.`);
    return new Response(JSON.stringify({ message: `Reset counters for ${freeUsers.length} users.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
