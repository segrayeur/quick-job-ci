import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MessageSquare, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FloatingBubbles from "@/components/FloatingBubbles";
import ChatBot from "@/components/ChatBot";

const Contact = () => {
  const navigate = useNavigate();

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Principal",
      description: "uauroratech2222@hotmail.com",
      action: () => window.open("mailto:uauroratech2222@hotmail.com?subject=Contact QuickJob CI", '_blank'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Mail,
      title: "Email Secondaire", 
      description: "auroratech2222@gmail.com",
      action: () => window.open("mailto:auroratech2222@gmail.com?subject=Contact QuickJob CI", '_blank'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      description: "+225 05 65 86 87 86",
      action: () => {
        const message = encodeURIComponent("Salut ! Je souhaite obtenir des informations sur QuickJob CI 👋");
        window.open(`https://wa.me/2250565868786?text=${message}`, '_blank');
      },
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      icon: MapPin,
      title: "Localisation",
      description: "Abidjan, Côte d'Ivoire",
      action: () => {},
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
            Contactez-nous
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Nous sommes là pour vous accompagner
          </p>
          <p className="text-lg text-primary font-medium">
            🤝 Une équipe dédiée à votre service !
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-border hover:border-primary/50 cursor-pointer"
                onClick={method.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${method.color} transition-all duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{method.title}</h3>
                      <p className="text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Information Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
          <h2 className="text-2xl font-bold text-center mb-8">
            À propos de QuickJob CI
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">🎯 Notre Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                Révolutionner le marché de l'emploi en Côte d'Ivoire en connectant efficacement 
                les talents locaux avec les opportunités professionnelles. Nous facilitons 
                l'accès à l'emploi pour tous.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">🚀 Nos Services</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Plateforme de recherche d'emploi</li>
                <li>• Outils de recrutement avancés</li>
                <li>• Assistance IA et chatbot</li>
                <li>• Support dédié aux entreprises</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              <strong className="text-primary">Horaires de support :</strong> 
              Lundi - Vendredi : 8h00 - 18h00 (GMT)
            </p>
            <p className="text-muted-foreground mt-2">
              <strong className="text-primary">Réponse moyenne :</strong> 
              Moins de 2 heures en semaine
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">
            Prêt à démarrer avec QuickJob CI ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Rejoignez des milliers d'utilisateurs qui nous font déjà confiance !
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4 text-lg font-medium hover:scale-105 transition-all duration-300"
            onClick={() => navigate('/auth')}
          >
            Commencer maintenant
          </Button>
        </div>
      </div>

      <FloatingBubbles />
      <ChatBot />
    </div>
  );
};

export default Contact;