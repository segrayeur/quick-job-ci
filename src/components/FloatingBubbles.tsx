import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Bot, 
  Sparkles,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const FloatingBubbles = () => {
  const [isOpen, setIsOpen] = useState(false);

  const bubbleActions = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        const message = encodeURIComponent("Salut ! Je suis intéressé par QuickJob CI 👋");
        window.open(`https://wa.me/+2250000000000?text=${message}`, '_blank');
      }
    },
    {
      icon: Mail,
      label: "Contact",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => {
        window.location.href = "mailto:contact@quickjobci.com?subject=Contact QuickJob CI";
      }
    },
    {
      icon: Bot,
      label: "Chatbot",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => {
        // This will be handled by the ChatBot component
        document.dispatchEvent(new CustomEvent('openChatbot'));
      }
    },
    {
      icon: Sparkles,
      label: "AI Assistant",
      color: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
      action: () => {
        // Open AI assistant functionality
        document.dispatchEvent(new CustomEvent('openAIAssistant'));
      }
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Action Bubbles */}
      <div className={cn(
        "flex flex-col gap-3 mb-4 transition-all duration-500 transform origin-bottom",
        isOpen ? "scale-100 opacity-100" : "scale-75 opacity-0 pointer-events-none"
      )}>
        {bubbleActions.map((bubble, index) => {
          const Icon = bubble.icon;
          return (
            <div
              key={index}
              className={cn(
                "relative group transition-all duration-300",
                isOpen ? "delay-100" : ""
              )}
              style={{ 
                transitionDelay: isOpen ? `${index * 100}ms` : '0ms' 
              }}
            >
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl border-2 border-white/20",
                  bubble.color
                )}
                onClick={bubble.action}
              >
                <Icon className="h-5 w-5 text-white" />
                <span className="sr-only">{bubble.label}</span>
              </Button>
              
              {/* Tooltip */}
              <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10">
                {bubble.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Toggle Button */}
      <Button
        size="icon"
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-white/20",
          "bg-gradient-to-r from-primary via-primary-glow to-primary",
          "hover:shadow-primary/25 hover:shadow-2xl",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Plus className="h-6 w-6 text-primary-foreground" />
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
  );
};

export default FloatingBubbles;