import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star } from "lucide-react";

interface JobCardProps {
  title: string;
  description: string;
  amount: string;
  location: string;
  timePosted: string;
  rating?: number;
  category?: string;
}

const JobCard = ({ title, description, amount, location, timePosted, rating, category }: JobCardProps) => {
  return (
    <Card className="w-full shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">{title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{timePosted}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{amount}</p>
            {category && <Badge variant="secondary" className="mt-1">{category}</Badge>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </CardDescription>
        {rating && (
          <div className="flex items-center space-x-1 mt-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-muted-foreground">{rating}/5</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
          Postuler maintenant
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;