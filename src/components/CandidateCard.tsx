import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, DollarSign } from "lucide-react";

interface CandidatePost {
  id: string;
  title: string;
  description: string;
  hourly_rate: number;
  currency: string;
  location: string;
  skills: string[];
  availability: string;
  created_at: string;
  candidate_id: string;
  users?: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}

interface CandidateCardProps {
  candidate: CandidatePost;
  onViewMore: () => void;
}

const CandidateCard = ({ candidate, onViewMore }: CandidateCardProps) => {
  const formatRate = (rate: number, currency: string) => {
    return `${rate.toLocaleString()} ${currency}/h`;
  };

  const getCandidateName = () => {
    if (candidate.users) {
      return `${candidate.users.first_name} ${candidate.users.last_name}`;
    }
    return "Candidat anonyme";
  };

  return (
    <Card className="w-full shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">{candidate.title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{getCandidateName()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{candidate.location}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{new Date(candidate.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-lg font-bold text-primary">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatRate(candidate.hourly_rate, candidate.currency)}
            </div>
            <Badge variant="secondary" className="mt-1">{candidate.availability}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {candidate.description}
        </CardDescription>
        
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Compétences :</p>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 3} autres
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={onViewMore}
        >
          Voir plus d'informations
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateCard;