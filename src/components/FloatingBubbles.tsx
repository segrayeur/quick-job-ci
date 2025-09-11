import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Mail, 
  Bot, 
  Brain,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import OpenAIAssistant from "./OpenAIAssistant";

const FloatingBubbles = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenAIOpen, setIsOpenAIOpen] = useState(false);

  // Log interaction function
  const logInteraction = async (type: string) => {
    try {
      const sessionId = Math.random().toString(36).substring(7);
      await supabase.from('interaction_logs').insert({
        interaction_type: type,
        session_id: sessionId,
        anonymous_user_id: !supabase.auth.getUser() ? sessionId : null
      });
    } catch (error) {
      console.log('Analytics logging error:', error);
    }
  };

  const bubbleActions = [
    {
      icon: MessageSquare,
      label: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        logInteraction('whatsapp');
        const message = encodeURIComponent("Salut ! Je suis intéressé par QuickJob CI 👋");
        window.open(`https://wa.me/2250565868786?text=${message}`, '_blank');
      }
    },
    {
      icon: Mail,
      label: "Contact Email",
      color: "bg-blue-500 hover:bg-blue-600", 
      action: () => {
        logInteraction('contact');
        window.open("mailto:uauroratech2222@hotmail.com?subject=Contact QuickJob CI", '_blank');
      }
    },
    {
      icon: Bot,
      label: "Chatbot QuickJob (RAG)",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => {
        logInteraction('chatbot_rag');
        document.dispatchEvent(new CustomEvent('openChatbot'));
      }
    },
    {
      icon: Brain,
      label: "OpenAI Assistant", 
      color: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
      action: () => {
        logInteraction('openai_assistant');
        setIsOpenAIOpen(true);
      }
    }
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end"
           style={{ 
             paddingBottom: 'env(safe-area-inset-bottom)', 
             paddingRight: 'env(safe-area-inset-right)' 
           }}>
        {/* Action Bubbles */}
        <div className={cn(
          "flex flex-col gap-3 mb-4 transition-all duration-300 transform origin-bottom",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}>
          {bubbleActions.map((bubble, index) => {
            const Icon = bubble.icon;
            return (
              <div
                key={index}
                className={cn(
                  "relative group transition-all duration-200",
                  isOpen ? "" : ""
                )}
                style={{ 
                  transitionDelay: isOpen ? `${index * 50}ms` : `${(bubbleActions.length - index) * 50}ms` 
                }}
              >
                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl border-2 border-white/20",
                    bubble.color
                  )}
                  onClick={bubble.action}
                  aria-label={bubble.label}
                  role="button"
                >
                  <Icon className="h-4 w-4 text-white" />
                  <span className="sr-only">{bubble.label}</span>
                </Button>
                
                {/* Tooltip */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-lg">
                  {bubble.label}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Toggle Button */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-3 border-white/20",
            "bg-gradient-to-r from-primary via-primary-glow to-primary",
            "hover:shadow-primary/25 hover:shadow-2xl",
            isOpen && "rotate-45"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          role="button"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-primary-foreground" />
          ) : (
            <Plus className="h-5 w-5 text-primary-foreground" />
          )}
        </Button>

        {/* Animated Background Ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/30 transition-all duration-1000",
          isOpen ? "scale-150 opacity-0" : "scale-100 opacity-100"
        )} />
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
      </div>

      {/* OpenAI Assistant Modal */}
      <OpenAIAssistant 
        isOpen={isOpenAIOpen} 
        onClose={() => setIsOpenAIOpen(false)} 
      />
    </>
  );
};

export default FloatingBubbles;