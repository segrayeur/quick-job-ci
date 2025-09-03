import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";
import { useState } from "react";

const locations = [
  "Tous",
  "Cocody", 
  "Yopougon",
  "Adjamé", 
  "Plateau",
  "Marcory",
  "Treichville",
  "Koumassi",
  "Port-Bouët",
  "Abobo",
  "Attécoubé"
];

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

const LocationFilter = ({ selectedLocation, onLocationChange }: LocationFilterProps) => {
  return (
    <div className="w-full bg-accent/50 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quartiers</span>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2">
            {locations.map((location) => (
              <Button
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                size="sm"
                onClick={() => onLocationChange(location)}
                className={`shrink-0 ${
                  selectedLocation === location 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-accent"
                }`}
              >
                {location}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LocationFilter;