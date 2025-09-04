import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, plan } = await req.json();
    
    if (!email || !plan) {
      throw new Error('Email and plan are required');
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Plan pricing in Nigerian Naira (considering CFA conversion)
    const planPricing = {
      'premium': {
        amount: 1500000, // 15,000 NGN (approximately 15,000 CFA)
        interval: 'monthly'
      }
    };

    const selectedPlan = planPricing[plan as keyof typeof planPricing];
    if (!selectedPlan) {
      throw new Error('Invalid plan selected');
    }

    // Create customer on Paystack
    const customerResponse = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      }),
    });

    const customerData = await customerResponse.json();
    console.log('Paystack customer response:', customerData);

    if (!customerData.status) {
      throw new Error(`Failed to create customer: ${customerData.message}`);
    }

    // Create subscription plan if it doesn't exist
    const planResponse = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `QuickJob CI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        amount: selectedPlan.amount,
        interval: selectedPlan.interval,
        currency: 'NGN',
      }),
    });

    const planData = await planResponse.json();
    console.log('Paystack plan response:', planData);

    let planCode = planData.data?.plan_code;
    
    // If plan already exists, get existing plan
    if (!planData.status && planData.message?.includes('already exists')) {
      const existingPlansResponse = await fetch('https://api.paystack.co/plan', {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      });
      const existingPlansData = await existingPlansResponse.json();
      const existingPlan = existingPlansData.data?.find((p: any) => 
        p.name.includes(plan.charAt(0).toUpperCase() + plan.slice(1))
      );
      planCode = existingPlan?.plan_code;
    }

    if (!planCode) {
      throw new Error('Failed to create or find subscription plan');
    }

    // Initialize subscription
    const subscriptionResponse = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerData.data.customer_code,
        plan: planCode,
        authorization: '', // Will be handled by Paystack checkout
      }),
    });

    const subscriptionData = await subscriptionResponse.json();
    console.log('Paystack subscription response:', subscriptionData);

    // Create payment link for the subscription
    const paymentLinkResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: selectedPlan.amount,
        currency: 'NGN',
        plan: planCode,
        callback_url: `${req.headers.get('origin')}/subscription-success`,
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      }),
    });

    const paymentData = await paymentLinkResponse.json();
    console.log('Paystack payment link response:', paymentData);

    if (!paymentData.status) {
      throw new Error(`Failed to create payment link: ${paymentData.message}`);
    }

    // Store subscription info in Supabase
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { error: insertError } = await supabaseService
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: plan,
        status: 'inactive',
        paystack_subscription_id: subscriptionData.data?.subscription_code || null,
        amount: selectedPlan.amount,
        currency: 'NGN',
      });

    if (insertError) {
      console.error('Error storing subscription:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      payment_url: paymentData.data.authorization_url,
      reference: paymentData.data.reference,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-paystack-subscription:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});