import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_type } = await req.json();
    
    // Get Paystack secret key
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not set');
    }

    // Plan configurations with 7-day trial
    const plans = {
      premium: {
        name: 'Plan Premium Recruteur',
        interval: 'monthly',
        amount: 1000000, // 10,000 FCFA in kobo
        currency: 'XOF',
        description: 'Plan Premium pour recruteurs - Essai gratuit 7 jours'
      },
      enterprise: {
        name: 'Plan Entreprise Pro', 
        interval: 'monthly',
        amount: 2500000, // 25,000 FCFA in kobo
        currency: 'XOF',
        description: 'Plan Entreprise Pro - Essai gratuit 7 jours'
      }
    };

    const planConfig = plans[plan_type as keyof typeof plans];
    if (!planConfig) {
      throw new Error('Invalid plan type');
    }

    // Create plan in Paystack
    const response = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: planConfig.name,
        interval: planConfig.interval,
        amount: planConfig.amount,
        currency: planConfig.currency,
        description: planConfig.description,
        send_invoices: true,
        send_sms: true,
        hosted_page: true,
        hosted_page_url: `${req.headers.get("origin")}/pricing`,
        hosted_page_summary: planConfig.description,
        migrate: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Paystack error: ${errorData.message}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      plan: data.data,
      plan_code: data.data.plan_code
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating Paystack plan:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});