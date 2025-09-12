import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `https://nzyeingkpsvyjoczsxpg.functions.supabase.co/admin-user-manager`;

const AdminCreateCandidate = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session invalide");

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "create_candidate", payload: form }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur inconnue");

      toast({ title: "Candidat créé", description: `Profil créé pour ${form.email}` });
      setForm({ email: "", password: "", first_name: "", last_name: "", phone: "", location: "" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un profil Candidat</CardTitle>
        <CardDescription>Créer un compte candidat (email confirmé) avec mot de passe.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required value={form.password} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Ville / Quartier</Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange} />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer le candidat"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminCreateCandidate;