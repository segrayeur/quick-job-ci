import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SimpleProfile from "@/components/SimpleProfile";
import CandidatePostManager from "@/components/CandidatePostManager";
import CandidateDatabase from "@/components/CandidateDatabase"; // Updated import
import RecruiterJobsManager from "@/components/RecruiterJobsManager";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterSubscriptionManager from "@/components/RecruiterSubscriptionManager";
import CandidateApplications from "@/components/CandidateApplications";
import AvailableJobs from "@/components/AvailableJobs";
import CandidateStats from "@/components/CandidateStats";
import { UserProfile } from "@/integrations/supabase/types"; // Assuming types are centralized

interface EnhancedDashboardProps {
  userProfile: UserProfile;
  onRefresh: () => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ userProfile, onRefresh }) => {

  // Recruiter Dashboard
  if (userProfile?.role === 'recruiter') {
    return (
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="jobs">Mes Offres</TabsTrigger>
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="candidates">Base de Candidats</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {/* Recruiter-specific stats components would go here */}
          <p>Statistiques du recruteur (à implémenter)</p>
        </TabsContent>
        <TabsContent value="jobs" className="space-y-4">
          <RecruiterJobsManager userProfile={userProfile} />
        </TabsContent>
        <TabsContent value="applications" className="space-y-4">
          <RecruiterApplications userProfile={userProfile} />
        </TabsContent>
        <TabsContent value="candidates" className="space-y-4">
          <CandidateDatabase userProfile={userProfile} />
        </TabsContent>
        <TabsContent value="subscription" className="space-y-4">
           <RecruiterSubscriptionManager userProfile={userProfile} />
        </TabsContent>
      </Tabs>
    );
  }

  // Candidate Dashboard
  return (
    <div className="space-y-6">
      <CandidateStats userProfile={userProfile} />

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="applications">Mes Candidatures</TabsTrigger>
          <TabsTrigger value="profile">Mon Profil</TabsTrigger>
          <TabsTrigger value="public-profile">Profil Public</TabsTrigger>
          <TabsTrigger value="jobs">Offres Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <CandidateApplications userProfile={userProfile} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
           <SimpleProfile userProfile={userProfile} onProfileUpdate={onRefresh} />
        </TabsContent>
        
        <TabsContent value="public-profile" className="space-y-4">
            <CandidatePostManager userProfile={userProfile} />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <AvailableJobs userProfile={userProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboard;
