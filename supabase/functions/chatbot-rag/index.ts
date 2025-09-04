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
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search knowledge base for relevant information
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*');

    if (kbError) {
      console.error('Error fetching knowledge base:', kbError);
    }

    // Simple keyword matching for RAG
    const userMessage = message.toLowerCase();
    const relevantEntries = knowledgeBase?.filter(entry => {
      const keywords = entry.keywords || [];
      return keywords.some((keyword: string) => 
        userMessage.includes(keyword.toLowerCase())
      ) || userMessage.includes(entry.question.toLowerCase());
    }) || [];

    // Build context from relevant entries
    let context = '';
    if (relevantEntries.length > 0) {
      context = 'Voici les informations pertinentes de notre base de connaissances :\n\n';
      relevantEntries.forEach(entry => {
        context += `Q: ${entry.question}\nR: ${entry.answer}\n\n`;
      });
    }

    // Create system prompt with context
    const systemPrompt = `Tu es l'assistant virtuel de QuickJob CI, une plateforme ivoirienne qui connecte les jeunes aux petits boulots de proximité.

${context}

Instructions :
- Réponds toujours en français
- Sois professionnel mais chaleureux
- Utilise les informations de la base de connaissances quand c'est pertinent
- Si tu n'as pas l'information, propose de contacter le support
- Encourage l'utilisation de QuickJob CI pour trouver du travail
- Mentionne que l'inscription est gratuite pour les jeunes candidats

Contexte de QuickJob CI :
- Plateforme de mise en relation entre jeunes ivoiriens et petits boulots
- Gratuit pour les candidats, abonnement premium pour les recruteurs
- Localisation par quartiers d'Abidjan
- Paiements sécurisés via Paystack
- Categories : livraison, ménage, déménagement, soutien scolaire, etc.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const assistantResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      response: assistantResponse,
      context_found: relevantEntries.length > 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot-rag:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      response: 'Désolé, je rencontre une difficulté technique. Veuillez réessayer ou contacter notre support.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});