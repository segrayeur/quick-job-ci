import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `https://nzyeingkpsvyjoczsxpg.functions.supabase.co/admin-user-manager`;

const AdminDeleteAccount = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Supprimer définitivement le compte ${email} ?`)) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session invalide");

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "delete_account", payload: { email } }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur inconnue");

      toast({ title: "Compte supprimé", description: `${email} a été supprimé.` });
      setEmail("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supprimer un compte</CardTitle>
        <CardDescription>Supprimer définitivement un utilisateur par email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" variant="destructive" disabled={loading}>{loading ? "Suppression..." : "Supprimer"}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminDeleteAccount;