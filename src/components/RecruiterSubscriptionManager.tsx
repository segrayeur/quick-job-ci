import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Crown, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  jobsLimit: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
}

interface UserProfile {
  id: string;
  jobs_published: number;
  subscription_plan: string;
  subscription_end?: string;
}

interface RecruiterSubscriptionManagerProps {
  userProfile: UserProfile;
  onUpgrade: () => void;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    currency: 'CFA',
    jobsLimit: 10,
    features: [
      '10 publications d\'emploi',
      'Gestion des candidatures',
      'Notifications en temps réel',
      'Support communautaire'
    ],
    icon: Zap
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1500,
    currency: 'CFA',
    jobsLimit: 25,
    features: [
      '25 publications d\'emploi/mois',
      'Accès aux CV des candidats',
      'Filtres avancés',
      'Statistiques détaillées',
      'Support prioritaire'
    ],
    icon: Crown,
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 3000,
    currency: 'CFA',
    jobsLimit: -1, // unlimited
    features: [
      'Publications illimitées',
      'Accès aux CV des candidats',
      'Vue des candidats les mieux notés',
      'Analytics avancées',
      'Support premium 24/7',
      'Badge entreprise vérifiée'
    ],
    icon: Star
  }
];

const RecruiterSubscriptionManager = ({ userProfile, onUpgrade }: RecruiterSubscriptionManagerProps) => {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === userProfile.subscription_plan) || plans[0];
  const remainingJobs = currentPlan.jobsLimit === -1 
    ? "Illimité" 
    : Math.max(0, currentPlan.jobsLimit - userProfile.jobs_published);
  
  const usagePercentage = currentPlan.jobsLimit === -1 
    ? 0 
    : (userProfile.jobs_published / currentPlan.jobsLimit) * 100;

  const handleUpgrade = async (planId: string) => {
    try {
      // For now, we'll just update the user's subscription plan
      // In a real app, this would involve payment processing
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_plan: planId,
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Abonnement mis à jour",
        description: `Vous êtes maintenant abonné au plan ${plans.find(p => p.id === planId)?.name}.`
      });

      setShowUpgradeDialog(false);
      onUpgrade();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'abonnement",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <currentPlan.icon className="h-5 w-5" />
                Plan {currentPlan.name}
                {currentPlan.popular && (
                  <Badge variant="default">Populaire</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {currentPlan.price > 0 
                  ? `${currentPlan.price.toLocaleString()} ${currentPlan.currency}/mois`
                  : 'Plan gratuit'
                }
              </CardDescription>
            </div>
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
              <DialogTrigger asChild>
                <Button variant={userProfile.subscription_plan === 'free' ? 'default' : 'outline'}>
                  {userProfile.subscription_plan === 'free' ? 'Passer au premium' : 'Changer de plan'}
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Publications utilisées</span>
                <span>
                  {userProfile.jobs_published} / {currentPlan.jobsLimit === -1 ? '∞' : currentPlan.jobsLimit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {typeof remainingJobs === 'string' 
                  ? remainingJobs 
                  : `${remainingJobs} publications restantes`
                }
              </p>
            </div>

            {userProfile.subscription_end && (
              <p className="text-sm text-muted-foreground">
                Expire le: {new Date(userProfile.subscription_end).toLocaleDateString('fr-FR')}
              </p>
            )}

            {currentPlan.jobsLimit !== -1 && userProfile.jobs_published >= currentPlan.jobsLimit * 0.8 && (
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Vous approchez de votre limite de publications. Pensez à passer à un plan supérieur.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choisir un plan d'abonnement</DialogTitle>
          <DialogDescription>
            Sélectionnez le plan qui correspond le mieux à vos besoins de recrutement.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = plan.id === userProfile.subscription_plan;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${
                  isCurrentPlan ? 'bg-muted/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default">Populaire</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <PlanIcon className="h-12 w-12 mx-auto text-primary" />
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price.toLocaleString()} {plan.currency}
                    {plan.price > 0 && <span className="text-sm font-normal">/mois</span>}
                  </div>
                  <CardDescription>
                    {plan.jobsLimit === -1 ? 'Publications illimitées' : `${plan.jobsLimit} publications`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan ? 'Plan actuel' : `Choisir ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </div>
  );
};

export default RecruiterSubscriptionManager;