import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";

const FAQ = () => {
  const faqItems = [
    {
      category: "Général",
      questions: [
        {
          question: "Qu'est-ce que QuickJob CI ?",
          answer: "QuickJob CI est une plateforme ivoirienne conçue pour connecter rapidement et efficacement les talents locaux avec des opportunités de petits boulots, de missions freelance et d'emplois flexibles."
        },
        {
          question: "Dans quelles villes QuickJob CI est-il disponible ?",
          answer: "Nous sommes disponibles dans les principales villes de Côte d'Ivoire, notamment Abidjan, Bouaké, et Yamoussoukro, avec une expansion continue. Notre système de filtre vous permet de rechercher des opportunités par ville, commune et même quartier."
        }
      ]
    },
    {
      category: "Pour les Candidats",
      questions: [
        {
          question: "L'inscription est-elle gratuite ?",
          answer: "Oui, l'inscription est 100% gratuite pour les candidats. Avec un compte gratuit, vous pouvez créer votre profil, spécifier vos compétences et commencer à postuler."
        },
        {
          question: "Combien de candidatures puis-je envoyer ?",
          answer: "Le nombre de candidatures dépend de votre plan :\n• Plan Gratuit : 20 candidatures par mois.\n• Plan Standard (3000 FCFA/mois) : 45 candidatures par mois.\n• Plan Pro (7500 FCFA/mois) : 100 candidatures par mois."
        },
        {
            question: "Qu'est-ce que les sous-secteurs ?",
            answer: "Les sous-secteurs vous permettent de préciser vos domaines d'expertise (jusqu'à 5). Par exemple, un professionnel de la restauration peut indiquer 'Service en salle', 'Cuisine', ou 'Plonge'. Cela aide les recruteurs à vous trouver plus facilement."
        }
      ]
    },
    {
      category: "Pour les Recruteurs",
      questions: [
        {
          question: "Comment publier une offre d'emploi ?",
          answer: "Après avoir créé votre compte recruteur, vous pouvez commencer à publier des offres. Le nombre d'offres que vous pouvez publier dépend de votre abonnement."
        },
        {
          question: "Quels sont les quotas de publication ?",
          answer: "Nos plans pour recruteurs sont les suivants :\n• Plan Gratuit : 30 publications d'offres par mois.\n• Plan Standard (1500 FCFA/mois) : 65 publications par mois.\n• Plan Pro (3000 FCFA/mois) : Publications illimitées et mise en avant des offres."
        }
      ]
    },
    {
      category: "Paiements et Sécurité",
      questions: [
        {
          question: "Les paiements sont-ils sécurisés ?",
          answer: "Absolument. Tous les paiements pour les abonnements sont traités de manière sécurisée. Nous utilisons des fournisseurs de paiement réputés pour garantir la protection de vos informations."
        },
        {
          question: "Comment mes données sont-elles protégées ?",
          answer: "La sécurité de vos données est notre priorité. Nous utilisons l'authentification sécurisée et les Row Level Security (RLS) de Supabase pour garantir que seul vous pouvez accéder à vos informations personnelles et les modifier."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Foire Aux Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Toutes les réponses à vos questions se trouvent ici.
            </p>
          </div>

          <div className="space-y-8">
            {faqItems.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-semibold text-foreground mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, questionIndex) => (
                    <Card key={questionIndex} className="mb-2">
                      <AccordionItem 
                        value={`${categoryIndex}-${questionIndex}`}
                        className="border-0"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left text-foreground hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-muted-foreground whitespace-pre-line">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </Card>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <Card className="mt-16">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">
                Besoin d'aide supplémentaire ?
              </CardTitle>
              <CardDescription>
                Notre équipe est là pour vous assister.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  variant="default"
                  className="gap-2"
                >
                  <a href="https://wa.me/+225XXXXXXXXXX?text=Bonjour, j'ai une question concernant QuickJob CI." target="_blank">
                    <MessageCircle className="h-4 w-4" />
                    Contact WhatsApp
                  </a>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a href="/contact">
                    <Phone className="h-4 w-4" />
                    Page de contact
                  </a>
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
