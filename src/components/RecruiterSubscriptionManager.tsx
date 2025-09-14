import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Crown, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/integrations/supabase/types";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  jobsLimit: number | string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
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
    jobsLimit: 30,
    features: [
      '30 publications d\'emploi',
      'Gestion des candidatures',
      'Notifications en temps réel',
    ],
    icon: Zap
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1500,
    currency: 'CFA',
    jobsLimit: 65,
    features: [
      '65 publications d\'emploi/mois',
      'Accès aux CV des candidats',
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
    jobsLimit: 'unlimited', 
    features: [
      'Publications illimitées',
      'Mise en avant des offres',
      'Accès complet à la CVthèque',
      'Analytics avancées',
      'Support premium 24/7'
    ],
    icon: Star
  }
];

const RecruiterSubscriptionManager = ({ userProfile, onUpgrade }: RecruiterSubscriptionManagerProps) => {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();

  const currentPlan = plans.find(p => p.id === userProfile.subscription_plan) || plans[0];
  const jobsLimitNumber = typeof currentPlan.jobsLimit === 'number' ? currentPlan.jobsLimit : 0;
  const remainingJobs = currentPlan.jobsLimit === 'unlimited'
    ? "Illimité" 
    : Math.max(0, jobsLimitNumber - userProfile.jobs_published);
  
  const usagePercentage = currentPlan.jobsLimit === 'unlimited' || jobsLimitNumber === 0
    ? 0 
    : (userProfile.jobs_published / jobsLimitNumber) * 100;

  const handleUpgrade = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_plan: planId,
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      toast({
        title: "Abonnement mis à jour!",
        description: `Vous êtes maintenant sur le plan ${plans.find(p => p.id === planId)?.name}.`
      });

      setShowUpgradeDialog(false);
      onUpgrade();
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'abonnement",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <currentPlan.icon className="h-5 w-5" />
                  Plan {currentPlan.name}
                </CardTitle>
                <CardDescription>
                  {currentPlan.price > 0 
                    ? `${currentPlan.price.toLocaleString()} ${currentPlan.currency}/mois`
                    : 'Plan gratuit'
                  }
                </CardDescription>
              </div>
              <DialogTrigger asChild>
                <Button variant={userProfile.subscription_plan === 'pro' ? 'outline' : 'default'}>
                  {userProfile.subscription_plan === 'pro' ? 'Gérer le plan' : 'Changer de plan'}
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Publications utilisées</span>
                  <span>
                    {userProfile.jobs_published} / {currentPlan.jobsLimit === 'unlimited' ? '∞' : jobsLimitNumber}
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
            </div>
          </CardContent>
        </Card>

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
                  className={`relative flex flex-col ${plan.popular ? 'ring-2 ring-primary' : ''} ${
                    isCurrentPlan ? 'border-primary' : ''
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
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow space-y-4">
                    <ul className="space-y-2 text-sm flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-1" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-auto"
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
    </Dialog>
  );
};

export default RecruiterSubscriptionManager;
