import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/integrations/supabase/types';

interface CandidateSubscriptionManagerProps {
  userProfile: UserProfile;
  onUpgrade: () => void;
}

const plans = {
  free: { name: "Gratuit", price: "0 FCFA/mois", applications: 20, features: ["Accès aux offres publiques", "20 candidatures/mois"] },
  standard: { name: "Standard", price: "3000 FCFA/mois", applications: 45, features: ["Accès prioritaire aux offres", "Profil mis en avant", "45 candidatures/mois"] },
  pro: { name: "Pro", price: "7500 FCFA/mois", applications: 100, features: ["Toutes les fonctionnalités Standard", "Assistance personnalisée", "100 candidatures/mois"] },
};

const CandidateSubscriptionManager = ({ userProfile, onUpgrade }: CandidateSubscriptionManagerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const currentPlan = userProfile.subscription_plan || 'free';

  const handleUpgrade = async (planKey: string) => {
    setLoading(true);
    try {
      // In a real scenario, you would redirect to a payment page first.
      // For this MVP, we directly update the subscription.
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_plan: planKey,
          // Also reset the counter and set an expiry date for the new plan
          applications_created_count: userProfile.applications_created_count, // Keep the current count
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      toast({ title: "Mise à niveau réussie!", description: `Vous êtes maintenant sur le plan ${plans[planKey].name}.` });
      onUpgrade(); // This function refreshes the user profile
    } catch (error: any) {
      toast({ title: "Erreur de mise à niveau", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ planKey, isCurrent }) => {
    const plan = plans[planKey];
    const planIndex = Object.keys(plans).indexOf(planKey);
    const currentIndex = Object.keys(plans).indexOf(currentPlan);

    return (
      <Card className={`${isCurrent ? "border-primary border-2 shadow-lg" : ""} flex flex-col`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {planKey === 'standard' && <Star className="text-yellow-500" />}
            {planKey === 'pro' && <Crown className="text-blue-500" />}
            {plan.name}
          </CardTitle>
          <CardDescription>{plan.price}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <p className="font-bold text-lg">{plan.applications} candidatures/mois</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {plan.features.map(feature => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {isCurrent ? (
            <Button disabled variant="outline" className="w-full">Plan Actuel</Button>
          ) : (
            <Button onClick={() => handleUpgrade(planKey)} className="w-full" disabled={loading || planIndex < currentIndex}>
              {loading ? "Chargement..." : "Choisir ce plan"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Gérer Votre Abonnement Candidat</CardTitle>
                <CardDescription>Votre plan actuel est <span className="font-bold text-primary">{plans[currentPlan]?.name || 'N/A'}</span>. Passez à un plan supérieur pour plus d'avantages.</CardDescription>
            </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PlanCard planKey="free" isCurrent={currentPlan === 'free'} />
            <PlanCard planKey="standard" isCurrent={currentPlan === 'standard'} />
            <PlanCard planKey="pro" isCurrent={currentPlan === 'pro'} />
        </div>
    </div>
  );
};

export default CandidateSubscriptionManager;
