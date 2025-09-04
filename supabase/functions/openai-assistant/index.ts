import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { message, session_id } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get user from auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    // Retrieve or create session
    let messages = [];
    if (session_id && userId) {
      const { data: session } = await supabaseClient
        .from('ai_sessions')
        .select('messages')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single();
      
      if (session) {
        messages = session.messages || [];
      }
    }

    // Add user message to session
    messages.push({ role: 'user', content: message });

    // Prepare OpenAI request
    const systemPrompt = `Tu es l'assistant général OpenAI pour QuickJob CI, une plateforme d'emploi en Côte d'Ivoire. 

Reste concis, utile et professionnel. Tu peux aider avec :
- Questions générales sur l'emploi
- Rédaction et reformulation de textes
- Conseils professionnels
- Idées créatives
- Assistance générale

IMPORTANT: Ne réponds jamais sur la facturation interne, les prix, ou les informations confidentielles de QuickJob CI. Pour ces questions, redirige vers le support.

Réponds en français et reste dans le contexte professionnel.`;

    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: requestMessages,
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;

    // Add assistant response to messages
    messages.push({ role: 'assistant', content: assistantReply });

    // Save session if user is authenticated
    if (userId) {
      const sessionData = {
        user_id: userId,
        session_type: 'openai',
        messages: messages,
        updated_at: new Date().toISOString()
      };

      if (session_id) {
        await supabaseClient
          .from('ai_sessions')
          .update(sessionData)
          .eq('id', session_id);
      } else {
        const { data: newSession } = await supabaseClient
          .from('ai_sessions')
          .insert(sessionData)
          .select('id')
          .single();
        
        return new Response(JSON.stringify({
          response: assistantReply,
          session_id: newSession?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      response: assistantReply,
      session_id: session_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OpenAI assistant:', error);
    return new Response(JSON.stringify({ 
      error: 'Désolé, je rencontre une difficulté technique. Veuillez réessayer.',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});