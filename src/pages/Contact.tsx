import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Clock, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    window.open('https://wa.me/2250707000000?text=Bonjour%20QuickJob%20CI,%20j\'aimerais%20avoir%20des%20informations', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:contact@quickjobci.com?subject=Demande d\'information QuickJob CI';
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Contactez-nous</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elevated mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">
                Besoin d'aide ?
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Notre équipe est là pour vous accompagner dans votre utilisation de QuickJob CI. N'hésitez pas à nous contacter !
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Methods */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 text-primary mr-2" />
                    WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Le moyen le plus rapide pour nous joindre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Écrivez-nous directement sur WhatsApp pour une réponse rapide
                  </p>
                  <Button 
                    onClick={handleWhatsApp}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    +225 07 00 00 00 00
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 text-primary mr-2" />
                    Email
                  </CardTitle>
                  <CardDescription>
                    Pour les questions détaillées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Envoyez-nous un email détaillé, nous vous répondrons dans les 24h
                  </p>
                  <Button 
                    onClick={handleEmail}
                    variant="outline" 
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    contact@quickjobci.com
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-2" />
                    Localisation
                  </CardTitle>
                  <CardDescription>
                    Notre zone de couverture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    <strong>Abidjan, Côte d'Ivoire</strong><br />
                    Nous couvrons tous les quartiers d'Abidjan :<br />
                    Cocody, Yopougon, Adjamé, Plateau, Marcory, Treichville, et plus encore.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    Horaires de support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span className="font-semibold">8h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi</span>
                    <span className="font-semibold">9h00 - 15h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="text-muted-foreground">Fermé</span>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note :</strong> Notre chatbot intelligent est disponible 24h/24 et 7j/7 pour répondre à vos questions fréquentes !
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Questions fréquentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">💰 L'inscription est-elle gratuite ?</h4>
                    <p className="text-sm text-muted-foreground">
                      Oui ! L'inscription et la recherche de jobs sont entièrement gratuites pour les candidats.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🔒 Mes paiements sont-ils sécurisés ?</h4>
                    <p className="text-sm text-muted-foreground">
                      Absolument. Nous utilisons Paystack, leader du paiement sécurisé en Afrique.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">📱 Comment publier un job ?</h4>
                    <p className="text-sm text-muted-foreground">
                      Inscrivez-vous en tant que recruteur, souscrivez au plan premium, puis publiez vos offres.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🤖 Comment utiliser le chatbot ?</h4>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur la bulle de chat en bas à droite de la page pour poser vos questions !
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elevated bg-gradient-primary text-white">
                <CardContent className="py-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Support prioritaire</h3>
                  <p className="mb-4 opacity-90 text-sm">
                    Les utilisateurs premium bénéficient d'un support prioritaire et d'une réponse garantie sous 2h
                  </p>
                  <Button 
                    variant="secondary"
                    onClick={() => navigate('/auth')}
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Devenir premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;