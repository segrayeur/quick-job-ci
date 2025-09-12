import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `https://nzyeingkpsvyjoczsxpg.functions.supabase.co/admin-user-manager`;

const AdminPasswordReset = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session invalide");

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reset_password", payload: { email, new_password: newPassword } }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur inconnue");

      toast({ title: "Mot de passe réinitialisé", description: `Mot de passe mis à jour pour ${email}` });
      setEmail("");
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réinitialiser le mot de passe</CardTitle>
        <CardDescription>Mettre à jour le mot de passe d'un utilisateur par email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Mise à jour..." : "Réinitialiser"}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminPasswordReset;