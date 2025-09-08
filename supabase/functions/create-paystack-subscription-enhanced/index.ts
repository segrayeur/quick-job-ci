import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { plan } = await req.json();
    
    // Plans configuration for QuickJob CI
    const plans = {
      standard: {
        name: 'Standard QuickJob CI',
        amount: 150000, // 1500 FCFA en centimes
        interval: 'monthly',
        description: '10 annonces actives, accès complet aux CV, gestion candidatures, badge vérifié',
        jobs_limit: 10,
        trial_days: 7
      },
      pro: {
        name: 'Pro QuickJob CI',
        amount: 300000, // 3000 FCFA en centimes
        interval: 'monthly',
        description: 'Annonces illimitées, accès illimité profils, mise en avant, support premium',
        jobs_limit: 999,
        trial_days: 7
      }
    };

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) {
      throw new Error('Plan non valide');
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    // Check if customer exists
    const customerResponse = await fetch(`https://api.paystack.co/customer/${encodeURIComponent(user.email)}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let customerId;
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      customerId = customerData.data.id;
    } else {
      // Create customer
      const createCustomerResponse = await fetch('https://api.paystack.co/customer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
        }),
      });

      if (!createCustomerResponse.ok) {
        throw new Error('Failed to create customer');
      }

      const customerData = await createCustomerResponse.json();
      customerId = customerData.data.id;
    }

    // Create plan
    const planResponse = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: selectedPlan.name,
        amount: selectedPlan.amount,
        interval: selectedPlan.interval,
        currency: 'XOF', // Franc CFA
        description: selectedPlan.description,
        send_invoices: true,
        send_sms: true,
      }),
    });

    const planData = await planResponse.json();
    const planCode = planData.data.plan_code;

    // Create subscription
    const subscriptionResponse = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerId,
        plan: planCode,
        authorization: '', // Will be handled by payment link
        start_date: new Date(Date.now() + (selectedPlan.trial_days * 24 * 60 * 60 * 1000)).toISOString(),
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Subscription creation failed:', errorData);
      throw new Error('Failed to create subscription');
    }

    const subscriptionData = await subscriptionResponse.json();

    // Create payment link
    const paymentLinkResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: selectedPlan.amount,
        currency: 'XOF',
        reference: `quickjob_${plan}_${Date.now()}`,
        callback_url: `${req.headers.get('origin')}/dashboard?subscription=success`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: plan
            },
            {
              display_name: 'Trial Days',
              variable_name: 'trial_days',
              value: selectedPlan.trial_days.toString()
            }
          ]
        },
        channels: ['card', 'mobile_money', 'bank_transfer'],
        plan: planCode,
      }),
    });

    if (!paymentLinkResponse.ok) {
      throw new Error('Failed to create payment link');
    }

    const paymentData = await paymentLinkResponse.json();

    // Store subscription in Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user profile
    const { data: userProfile } = await supabaseService
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (userProfile) {
      await supabaseService.from('subscriptions').upsert({
        user_id: userProfile.id,
        plan: plan,
        status: 'inactive',
        paystack_subscription_id: subscriptionData.data.subscription_code,
        amount: selectedPlan.amount,
        currency: 'XOF',
        jobs_limit: selectedPlan.jobs_limit,
        trial_days: selectedPlan.trial_days,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payment_url: paymentData.data.authorization_url,
      reference: paymentData.data.reference,
      subscription_code: subscriptionData.data.subscription_code,
      plan: selectedPlan,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-paystack-subscription-enhanced:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});