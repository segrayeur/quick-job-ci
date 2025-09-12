import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PublishJob from "./pages/PublishJob";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardRecruteur from "./pages/DashboardRecruteur";
import DashboardCandidat from "./pages/DashboardCandidat";
import AccesNonAutorise from "./pages/AccesNonAutorise";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import TrouverUnJob from "./pages/TrouverUnJob";
import TrouverUnCandidat from "./pages/TrouverUnCandidat";
import FAQ from "./pages/FAQ";
import AuthEnforcer from "./components/AuthEnforcer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthEnforcer />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/publish" element={<PublishJob />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/connexion" element={<Auth />} />
          <Route path="/inscription" element={<Auth />} />
          <Route path="/trouver-un-job" element={<TrouverUnJob />} />
          <Route path="/trouver-un-candidat" element={<TrouverUnCandidat />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/recruteur" element={<DashboardRecruteur />} />
          <Route path="/dashboard/candidat" element={<DashboardCandidat />} />
          <Route path="/dashboard/admin" element={<Dashboard />} />
          <Route path="/acces-non-autorise" element={<AccesNonAutorise />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
