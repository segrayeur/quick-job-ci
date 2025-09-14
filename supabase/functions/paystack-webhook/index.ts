import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not set');
    }

    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    if (signature) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(paystackSecretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"],
      );
      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(body),
      );
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    // Initialize Supabase with service role
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.create':
      case 'subscription.enable':
        await handleSubscriptionActive(supabaseServiceClient, event.data);
        break;
      
      case 'subscription.disable':
      case 'subscription.not_renew':
        await handleSubscriptionInactive(supabaseServiceClient, event.data);
        break;
      
      case 'invoice.create':
      case 'invoice.update':
        await handleInvoiceEvent(supabaseServiceClient, event.data);
        break;

      default:
        console.log('Unhandled event type:', event.event);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function handleSubscriptionActive(supabaseClient: any, data: any) {
  const { customer, plan, subscription_code, next_payment_date } = data;
  
  // Find user by email
  const { data: userData } = await supabaseClient
    .from('users')
    .select('user_id')
    .eq('email', customer.email)
    .single();

  if (userData) {
    const planType = plan.amount === 1000000 ? 'premium' : 'enterprise';
    
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userData.user_id,
        plan: planType,
        status: 'active',
        paystack_subscription_id: subscription_code,
        plan_id: plan.plan_code,
        amount: plan.amount,
        currency: plan.currency,
        renew_date: new Date(next_payment_date).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  }
}

async function handleSubscriptionInactive(supabaseClient: any, data: any) {
  const { customer, subscription_code } = data;
  
  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('paystack_subscription_id', subscription_code);
}

async function handleInvoiceEvent(supabaseClient: any, data: any) {
  const { customer, subscription, status, paid_at } = data;
  
  if (status === 'success' && paid_at) {
    // Mark as active if payment successful
    await supabaseClient
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('paystack_subscription_id', subscription.subscription_code);
  }
}