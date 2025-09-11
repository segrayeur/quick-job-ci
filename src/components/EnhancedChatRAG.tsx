import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface EnhancedChatRAGProps {
  isOpen: boolean;
  onToggle: () => void;
}

const EnhancedChatRAG = ({ isOpen, onToggle }: EnhancedChatRAGProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! 👋 Je suis votre assistant IA QuickJob. Comment puis-je vous aider aujourd\'hui ?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-rag', {
        body: { message: inputValue }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Désolé, je n'ai pas pu traiter votre demande.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          className={cn(
            "h-16 w-16 rounded-full shadow-cosmic transition-all duration-500 hover:scale-110 glass-effect",
            "bg-gradient-aurora border-3 border-secondary-glow/40 neon-glow",
            "hover:shadow-glow hover:bg-gradient-neon animate-bounce-subtle"
          )}
        >
          <MessageCircle className="h-6 w-6 text-white drop-shadow-lg" />
        </Button>
        
        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 animate-ping">
          <Sparkles className="h-4 w-4 text-secondary-glow" />
        </div>
        <div className="absolute -bottom-2 -left-2 animate-pulse">
          <Sparkles className="h-3 w-3 text-accent" />
        </div>
        
        {/* Rotating glow ring */}
        <div className="absolute -inset-2 rounded-full bg-gradient-aurora opacity-20 animate-rotate-slow pointer-events-none blur-sm" />
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out",
      "animate-scale-in"
    )}>
      <Card className={cn(
        "w-96 glass-effect shadow-cosmic border-2 border-primary-glow/30 backdrop-blur-xl",
        isMinimized ? "h-16" : "h-[500px]",
        "transition-all duration-500 ease-bounce"
      )}>
        <CardHeader className="p-4 border-b border-primary-glow/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="relative">
                <Bot className="h-5 w-5 text-secondary-glow animate-pulse" />
                <div className="absolute -inset-1 bg-secondary-glow/20 rounded-full animate-ping" />
              </div>
              Assistant IA QuickJob
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[400px]">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3 animate-fade-in",
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-glow",
                      message.role === 'user' 
                        ? 'bg-gradient-primary border border-primary-glow/30' 
                        : 'bg-gradient-secondary border border-secondary-glow/30'
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white animate-pulse" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[70%] rounded-lg p-3 glass-effect border",
                      message.role === 'user'
                        ? 'bg-gradient-primary/20 border-primary-glow/30 text-foreground'
                        : 'bg-gradient-secondary/20 border-secondary-glow/30 text-foreground',
                      "shadow-cosmic animate-slide-in-left"
                    )}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 animate-fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-secondary border border-secondary-glow/30 flex items-center justify-center shadow-glow">
                      <Bot className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <div className="glass-effect rounded-lg p-3 bg-gradient-secondary/20 border border-secondary-glow/30 shadow-cosmic">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-secondary-glow rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-secondary-glow rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-secondary-glow rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-primary-glow/20">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={isLoading}
                  className="flex-1 glass-effect border-primary-glow/30 text-foreground placeholder:text-muted-foreground focus:border-primary-glow focus:ring-primary-glow/20"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className={cn(
                    "bg-gradient-primary hover:bg-gradient-aurora transition-all duration-300",
                    "shadow-glow hover:shadow-neon hover:scale-105 glass-effect border border-primary-glow/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedChatRAG;