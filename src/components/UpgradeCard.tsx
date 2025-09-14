import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UpgradeCardProps {
  userProfile: any;
}

const UpgradeCard = ({ userProfile }: UpgradeCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Passez à un compte supérieur</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Passez à un compte supérieur pour débloquer plus de fonctionnalités.</p>
      </CardContent>
      <CardFooter>
        <Button>Mettre à niveau</Button>
      </CardFooter>
    </Card>
  );
};

export default UpgradeCard;
