import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";

const FAQ = () => {
  const faqItems = [
    {
      category: "À propos de QuickJob CI",
      questions: [
        {
          question: "Qu'est-ce que QuickJob CI ?",
          answer: "QuickJob CI est une plateforme ivoirienne qui connecte les jeunes à la recherche de petits boulots avec les recruteurs, particuliers et entreprises. Notre mission est de faciliter l'accès rapide à des jobs rémunérateurs en Côte d'Ivoire."
        }
      ]
    },
    {
      category: "Inscription candidats",
      questions: [
        {
          question: "Comment créer un compte candidat ?",
          answer: "L'inscription est gratuite pour tous les candidats. Vous pouvez créer un compte avec votre email, votre Google ou Facebook. Une fois inscrit, vous pouvez remplir votre profil (compétences, CV, ville, quartier)."
        },
        {
          question: "Puis-je postuler à plusieurs offres ?",
          answer: "Oui ! Les candidats peuvent postuler à toutes les offres sans limite. Il n'y a aucune restriction sur le nombre de candidatures."
        }
      ]
    },
    {
      category: "Inscription recruteurs",
      questions: [
        {
          question: "Comment publier une annonce ?",
          answer: "Les recruteurs doivent créer un compte pour publier des annonces. Ils peuvent choisir un plan d'abonnement (Standard, Pro, Entreprise). Les annonces doivent respecter nos règles (pas d'arnaques, pas de fausses offres)."
        }
      ]
    },
    {
      category: "Plans et tarification",
      questions: [
        {
          question: "Quels sont les tarifs ?",
          answer: "• Gratuit (Candidats) : accès aux offres et candidatures illimitées\n• Standard (15 000 FCFA/mois, 1 semaine gratuite) : jusqu'à 10 annonces, accès aux CV\n• Pro (30 000 FCFA/mois, 1 semaine gratuite) : annonces illimitées, mise en avant, support prioritaire\n• Entreprise (sur devis) : multi-compte, dashboard RH dédié"
        }
      ]
    },
    {
      category: "Paiements & sécurité",
      questions: [
        {
          question: "Comment se font les paiements ?",
          answer: "Tous les paiements se font via Paystack (Mobile Money, cartes bancaires). Les données des utilisateurs sont sécurisées avec Supabase + RLS. QuickJob CI ne partage jamais vos informations personnelles sans consentement."
        }
      ]
    },
    {
      category: "Géolocalisation",
      questions: [
        {
          question: "Dans quelles villes QuickJob CI est-il disponible ?",
          answer: "QuickJob CI est disponible dans toutes les villes principales : Abidjan, Bouaké, Yamoussoukro, San Pedro, Daloa, Korhogo, Man, Gagnoa, Abengourou. Les offres peuvent être filtrées par ville et quartier. Une carte interactive permet de voir les jobs autour de vous."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-cosmic">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Questions Fréquemment Posées
            </h1>
            <p className="text-lg text-muted-foreground">
              Trouvez rapidement les réponses à vos questions sur QuickJob CI
            </p>
          </div>

          <div className="grid gap-8">
            {faqItems.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, questionIndex) => (
                      <AccordionItem 
                        key={questionIndex} 
                        value={`${categoryIndex}-${questionIndex}`}
                        className="border-border/30"
                      >
                        <AccordionTrigger className="text-left text-foreground hover:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Support et contact */}
          <Card className="mt-12 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">
                Support & Contact
              </CardTitle>
              <CardDescription>
                Vous ne trouvez pas la réponse à votre question ? Contactez-nous !
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Vous pouvez nous contacter par email, WhatsApp ou via le chatbot.
                L'équipe est disponible 7j/7 pour vous aider.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={() => window.open('https://wa.me/+2250000000000?text=Bonjour 👋, comment puis-je vous aider ?', '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.location.href = '/contact'}
                >
                  <Phone className="h-4 w-4" />
                  Nous contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;