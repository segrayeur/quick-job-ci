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
  const logInteraction = async (type: string, data?: any) => {
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

  const toggleBubbles = () => {
    setIsOpen(!isOpen);
    logInteraction(isOpen ? 'bubbles_close' : 'bubbles_open');
  };

  const bubbles = [
    {
      id: 'whatsapp',
      icon: MessageSquare,
      label: "WhatsApp Support",
      color: "bg-green-500 hover:bg-green-600 shadow-glow",
      action: () => {
        logInteraction('whatsapp', { bubbleId: 'whatsapp', label: 'WhatsApp Support' });
        const message = encodeURIComponent("Salut ! Je suis intéressé par QuickJob CI 👋");
        window.open(`https://wa.me/2250565868786?text=${message}`, '_blank');
      }
    },
    {
      id: 'openai',
      icon: Brain,
      label: "Assistant IA OpenAI",
      color: "bg-orange-500 hover:bg-orange-600 shadow-neon",
      action: () => {
        logInteraction('openai_assistant', { bubbleId: 'openai', label: 'Assistant IA OpenAI' });
        setIsOpenAIOpen(true);
      }
    }
  ];

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        {/* Bubble buttons container */}
        <div 
          className={cn(
            "absolute bottom-16 left-0 flex flex-col-reverse gap-4 transition-all duration-500 origin-bottom-left",
            isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-4 pointer-events-none"
          )}
        >
          {bubbles.map((bubble, index) => (
            <div key={bubble.id} className="relative group">
              {/* Bubble button with enhanced animations */}
              <div 
                className={cn(
                  "transition-all duration-500 bounce-in floating",
                  isOpen && `delay-[${index * 150}ms]`
                )}
                style={{
                  animationDelay: isOpen ? `${index * 150}ms` : '0ms'
                }}
              >
                <Button
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-cosmic transition-all duration-300 hover:scale-125 hover:shadow-neon glass-effect neon-glow",
                    "border-2 border-white/30 backdrop-blur-sm",
                    "hover:rotate-12 text-white",
                    bubble.color
                  )}
                  onClick={bubble.action}
                  onMouseEnter={() => {
                    logInteraction('bubble_hover', { bubbleId: bubble.id, label: bubble.label });
                  }}
                >
                  <bubble.icon className="h-5 w-5 text-foreground drop-shadow-lg" />
                </Button>
              </div>
              
              {/* Enhanced tooltip */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-effect text-foreground text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 z-10 shadow-cosmic border border-primary-glow/30">
                {bubble.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary-glow/50"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced main toggle button */}
        <div className="relative">
          <Button
            size="icon"
            className={cn(
              "h-16 w-16 rounded-full shadow-cosmic transition-all duration-500 hover:scale-110 glass-effect",
              "bg-gradient-primary border-3 border-primary-glow/40 neon-glow",
              "hover:shadow-glow hover:bg-gradient-secondary",
              isOpen && "rotate-180 scale-110"
            )}
            onClick={toggleBubbles}
            role="button"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-foreground drop-shadow-lg animate-pulse" />
            ) : (
              <Plus className="h-6 w-6 text-foreground drop-shadow-lg animate-bounce-subtle" />
            )}
          </Button>

          {/* Enhanced ripple effects */}
          <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 scale-0 animate-ping pointer-events-none" />
          <div className="absolute inset-0 rounded-full bg-gradient-aurora opacity-10 scale-0 animate-pulse pointer-events-none" />
          
          {/* Rotating glow ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-primary opacity-30 animate-rotate-slow pointer-events-none blur-sm" />
        </div>
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