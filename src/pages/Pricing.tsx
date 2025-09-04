import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, Users, Building, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatBot from "@/components/ChatBot";
import FloatingBubbles from "@/components/FloatingBubbles";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Pour les Jeunes",
      price: "Gratuit",
      period: "toujours",
      badge: "🎉 100% Gratuit",
      badgeVariant: "secondary" as const,
      description: "Parfait pour débuter votre carrière",
      features: [
        "Consulter tous les jobs gratuitement",
        "Postuler directement aux offres",
        "Accès au chatbot d'aide",
        "Support communautaire"
      ],
      buttonText: "Commencer Gratuitement",
      buttonVariant: "outline" as const,
      popular: false,
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      name: "Pour les Recruteurs",
      price: "10 000 FCFA",
      period: "par mois",
      badge: "⭐ Premium",
      badgeVariant: "default" as const,
      description: "Idéal pour les recruteurs actifs",
      features: [
        "✨ Essai gratuit 7 jours inclus !",
        "Poster des annonces illimitées",
        "Tableau de bord recruteur complet",
        "Assistance prioritaire",
        "Statistiques détaillées",
        "Gestion des candidatures"
      ],
      buttonText: "Essayer 7 jours gratuits",
      buttonVariant: "default" as const,
      popular: true,
      gradient: "from-orange-500/10 to-red-500/10"
    },
    {
      name: "Pour les Entreprises",
      price: "25 000 FCFA",
      period: "par mois",
      badge: "🚀 Pro",
      badgeVariant: "default" as const,
      description: "Solution complète pour les entreprises",
      features: [
        "✨ Essai gratuit 7 jours inclus !",
        "Poster illimité + priorité",
        "Tableau de bord complet avancé",
        "Équipe multi-utilisateurs",
        "API et intégrations",
        "Support dédié 24/7",
        "Rapports personnalisés"
      ],
      buttonText: "Essayer 7 jours gratuits",
      buttonVariant: "default" as const,
      popular: false,
      gradient: "from-purple-500/10 to-pink-500/10"
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Plans & Tarifs
            </h1>
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            QuickJob CI - Trouvez votre place dans l'écosystème
          </p>
          <p className="text-lg text-primary font-medium">
            🎯 Des solutions adaptées à chaque profil !
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${
                plan.popular 
                  ? 'border-primary shadow-xl scale-105 ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-center py-2 text-sm font-medium">
                  🔥 Le plus populaire !
                </div>
              )}
              
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
              
              <CardHeader className={`relative ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <Badge variant={plan.badgeVariant} className="text-xs">
                    {plan.badge}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.buttonVariant} 
                  className="w-full py-6 text-base font-medium transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/auth')}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Pourquoi choisir QuickJob CI ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-4xl">🎯</div>
              <h3 className="font-semibold">Ciblé Côte d'Ivoire</h3>
              <p className="text-sm text-muted-foreground">
                Spécialement conçu pour le marché de l'emploi ivoirien
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">⚡</div>
              <h3 className="font-semibold">Rapidité & Efficacité</h3>
              <p className="text-sm text-muted-foreground">
                Trouvez ou publiez des offres en quelques clics
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">🤝</div>
              <h3 className="font-semibold">Support Local</h3>
              <p className="text-sm text-muted-foreground">
                Une équipe dédiée qui comprend vos besoins
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">
            Prêt à rejoindre la communauté QuickJob CI ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Commencez dès aujourd'hui et découvrez de nouvelles opportunités !
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4 text-lg font-medium hover:scale-105 transition-all duration-300"
            onClick={() => navigate('/auth')}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Commencer maintenant
          </Button>
        </div>
      </div>

      <FloatingBubbles />
      <ChatBot />
    </div>
  );
};

export default Pricing;