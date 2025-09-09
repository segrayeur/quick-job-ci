import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LocationSelectorProps {
  selectedCommune?: string;
  selectedQuartier?: string;
  onCommuneChange: (commune: string) => void;
  onQuartierChange: (quartier: string) => void;
  className?: string;
}

// Mapping des communes avec leurs quartiers respectifs
const communesWithQuartiers: Record<string, string[]> = {
  "cocody": [
    "Riviera 1", "Riviera 2", "Riviera 3", "Riviera Golf", 
    "Angré", "II Plateaux", "Vallon", "Faya", "Blockhaus"
  ],
  "yopougon": [
    "Millionnaire", "Sideci", "Maroc", "Niangon", "Ficgayo", 
    "Selmer", "Mamie Faitai", "Toits Rouges", "Port-Bouët 2"
  ],
  "adjame": [
    "Bracodi", "N'dotré", "Williamsville", "Abobo-Gare", 
    "Liberté", "220 Logements", "Village"
  ],
  "plateau": [
    "Centre-ville", "Ambassades", "Cathédrale", "Ponty", 
    "Ministères", "Banco", "République"
  ],
  "marcory": [
    "Zone 4", "Anoumambo", "Remblais", "Biétry", 
    "Aviation", "Résidentiel"
  ],
  "koumassi": [
    "Koumassi Remblais", "Sicogi", "Grand Marché", 
    "Gonzagueville", "Vitré"
  ],
  "treichville": [
    "Arras 1", "Arras 2", "Belleville", "Préfecture", 
    "Zone Industrielle", "Vridi"
  ],
  "port-bouet": [
    "Vridi", "Zone 3", "Zone 4A", "Aéroport", 
    "Grand-Bassam Route", "Phare"
  ],
  "abobo": [
    "PK 18", "Anyama", "Baoulé", "Sagbé", "N'dotré", 
    "Té", "Avocatier"
  ],
  "attecoube": [
    "Santé", "Locodjro", "Banco 2", "Habitat", 
    "Agouéto", "Village"
  ]
};

export const LocationSelector = ({ 
  selectedCommune = "", 
  selectedQuartier = "",
  onCommuneChange, 
  onQuartierChange,
  className = "" 
}: LocationSelectorProps) => {
  
  const handleCommuneChange = (value: string) => {
    onCommuneChange(value);
    // Reset quartier when commune changes
    onQuartierChange("");
  };

  const availableQuartiers = selectedCommune ? communesWithQuartiers[selectedCommune] || [] : [];

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div>
        <Label htmlFor="commune">Commune</Label>
        <Select value={selectedCommune} onValueChange={handleCommuneChange}>
          <SelectTrigger id="commune">
            <SelectValue placeholder="Choisir une commune" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sélectionner...</SelectItem>
            {Object.keys(communesWithQuartiers).map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune.charAt(0).toUpperCase() + commune.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="quartier">Quartier</Label>
        <Select 
          value={selectedQuartier} 
          onValueChange={onQuartierChange}
          disabled={!selectedCommune || availableQuartiers.length === 0}
        >
          <SelectTrigger id="quartier">
            <SelectValue placeholder={selectedCommune ? "Choisir un quartier" : "D'abord choisir commune"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sélectionner...</SelectItem>
            {availableQuartiers.map((quartier) => (
              <SelectItem key={quartier} value={quartier}>
                {quartier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSelector;