import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Phone, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PublishJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    location: "",
    commune: "",
    quartier: "",
    contact: "",
    whatsapp: "",
    category: "",
    startDate: "",
    endDate: ""
  });

  const cities = ["Abidjan", "Bouaké", "Daloa", "San-Pédro", "Yamoussoukro"];
  
  const communes = {
    Abidjan: ["Cocody", "Yopougon", "Adjamé", "Plateau", "Marcory", "Treichville", "Koumassi", "Port-Bouët", "Abobo", "Attécoubé"],
    Bouaké: ["Gonfreville", "Dar es Salam", "Koko", "Brobo", "Sakassou"],
    Daloa: ["Lobia", "Gadouan", "Tazibouo", "Issia", "Vavoua"],
    "San-Pédro": ["Sassandra", "Soubré", "Méagui", "Tabou", "Grand-Béréby"],
    Yamoussoukro: ["Attiégouakro", "Kossou", "Lolobo", "Didiévi"]
  };

  const quartiers = {
    Cocody: ["Riviera", "Deux Plateaux", "Angré", "Ambassades", "Blockhaus"],
    Yopougon: ["Selmer", "Niangon", "Maroc", "Sideci", "Wassakara"],
    Adjamé: ["220 logements", "Bracodi", "Mairie", "Nouveau Quartier", "Williamsville"],
    Plateau: ["Centre-ville", "Administratif", "Fin Prêt", "Millionnaire", "Solibra"]
  };

  const categories = [
    "Livraison", "Ménage", "Déménagement", "Soutien scolaire",
    "Mise en rayon", "Gardiennage", "Informatique", "Autre"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.amount || !formData.location || !formData.startDate || !formData.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Job publié !",
      description: "Votre offre d'emploi a été publiée avec succès",
    });

    // Redirect to home after publishing
    navigate("/");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Publier un job</h1>
        </div>

        <Card className="max-w-2xl mx-auto shadow-elevated">
          <CardHeader>
            <CardTitle className="text-xl text-center">Créer votre offre</CardTitle>
            <CardDescription className="text-center">
              Publiez votre job rapidement et trouvez des candidats motivés
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du job *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Aide pour déménagement ce weekend"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez précisément le travail à effectuer, les horaires, les conditions..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (FCFA) *</Label>
                  <Input
                    id="amount"
                    placeholder="Ex: 15000"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div className="space-y-4">
                 <Label>Localisation *</Label>
                 <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label>Ville *</Label>
                     <Select onValueChange={(value) => {
                       handleInputChange("location", value);
                       handleInputChange("commune", "");
                       handleInputChange("quartier", "");
                     }}>
                       <SelectTrigger>
                         <SelectValue placeholder="Choisir une ville" />
                       </SelectTrigger>
                       <SelectContent>
                         {cities.map((city) => (
                           <SelectItem key={city} value={city}>
                             {city}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label>Commune *</Label>
                     <Select 
                       value={formData.commune}
                       onValueChange={(value) => {
                         handleInputChange("commune", value);
                         handleInputChange("quartier", "");
                       }}
                       disabled={!formData.location}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Choisir une commune" />
                       </SelectTrigger>
                       <SelectContent>
                         {formData.location && communes[formData.location as keyof typeof communes]?.map((commune) => (
                           <SelectItem key={commune} value={commune}>
                             {commune}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label>Quartier</Label>
                     <Select 
                       value={formData.quartier}
                       onValueChange={(value) => handleInputChange("quartier", value)}
                       disabled={!formData.commune}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Choisir un quartier" />
                       </SelectTrigger>
                       <SelectContent>
                         {formData.commune && quartiers[formData.commune as keyof typeof quartiers]?.map((quartier) => (
                           <SelectItem key={quartier} value={quartier}>
                             {quartier}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="startDate">Date de début *</Label>
                   <Input
                     id="startDate"
                     type="date"
                     value={formData.startDate}
                     onChange={(e) => handleInputChange("startDate", e.target.value)}
                     min={new Date().toISOString().split('T')[0]}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="endDate">Date de fin *</Label>
                   <Input
                     id="endDate"
                     type="date"
                     value={formData.endDate}
                     onChange={(e) => handleInputChange("endDate", e.target.value)}
                     min={formData.startDate || new Date().toISOString().split('T')[0]}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="contact">Téléphone *</Label>
                   <div className="relative">
                     <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                       id="contact"
                       placeholder="+225 07 XX XX XX XX"
                       value={formData.contact}
                       onChange={(e) => handleInputChange("contact", e.target.value)}
                       className="pl-10"
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="whatsapp">WhatsApp (optionnel)</Label>
                   <div className="relative">
                     <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                       id="whatsapp"
                       placeholder="+225 07 XX XX XX XX"
                       value={formData.whatsapp}
                       onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                       className="pl-10"
                     />
                   </div>
                 </div>
               </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg py-6"
              >
                Publier le job
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublishJob;