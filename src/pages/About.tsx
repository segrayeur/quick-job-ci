import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Target, Award, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">À propos de QuickJob CI</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">
                Notre Mission
              </CardTitle>
              <CardDescription className="text-lg mt-4 text-gray-600">
                QuickJob CI est une plateforme SaaS ivoirienne qui connecte en temps réel les jeunes aux petits boulots disponibles dans leur quartier, tout en offrant aux particuliers et entreprises un moyen simple, rapide et fiable de trouver de l'aide pour leurs besoins quotidiens.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-primary text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-gray-700">Inclusion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500">
                  Nous croyons que chaque jeune mérite une opportunité de développer ses compétences et de gagner sa vie dignement.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-primary text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-gray-700">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500">
                  Nous modernisons l'accès aux opportunités locales grâce à une technologie adaptée au contexte ivoirien.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-primary text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-gray-700">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500">
                  Nous nous engageons à fournir une plateforme sécurisée, fiable et facile à utiliser pour tous nos utilisateurs.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">Notre Histoire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600">
              <p>
                QuickJob CI est né d'un constat simple : en Côte d'Ivoire, de nombreux jeunes cherchent des opportunités de travail flexible et rémunératrice, tandis que de nombreux particuliers et entreprises ont besoin d'aide pour des tâches ponctuelles.
              </p>
              <p>
                Notre plateforme comble ce fossé en créant un écosystème numérique où l'offre et la demande se rencontrent facilement. Avec une base sécurisée, un système d'abonnement flexible et un chatbot intelligent, nous modernisons l'accès aux opportunités locales.
              </p>
              <p>
                Nous soutenons l'insertion économique de la jeunesse ivoirienne en leur donnant accès à des revenus complémentaires tout en aidant les recruteurs à trouver rapidement des candidats motivés et disponibles.
              </p>
            </CardContent>
          </Card>

          {/* Impact Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center text-gray-800">
                <Heart className="h-6 w-6 text-primary mr-2" />
                Notre Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <h3 className="text-3xl font-bold text-primary">100%</h3>
                  <p className="text-gray-500">Gratuit pour les jeunes candidats</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-primary">10+</h3>
                  <p className="text-gray-500">Quartiers d'Abidjan couverts</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-primary">24/7</h3>
                  <p className="text-gray-500">Assistant intelligent disponible</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="shadow-lg bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Rejoignez la révolution du travail flexible en Côte d'Ivoire
              </h2>
              <p className="mb-6 opacity-90">
                Que vous soyez un jeune cherchant des opportunités ou un recruteur ayant des besoins ponctuels, QuickJob CI est fait pour vous.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/auth')}
                >
                  Commencer maintenant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/contact')}
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Nous contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
