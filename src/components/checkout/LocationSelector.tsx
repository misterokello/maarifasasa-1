import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";

interface LocationSelectorProps {
  selected: "uganda" | "international";
  onSelect: (location: "uganda" | "international") => void;
}

export function LocationSelector({ selected, onSelect }: LocationSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Where are you located?</label>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={selected === "uganda" ? "default" : "outline"}
          className={`h-auto py-4 flex flex-col items-center gap-2 ${
            selected === "uganda" ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          onClick={() => onSelect("uganda")}
        >
          <MapPin className="h-5 w-5" />
          <span className="font-medium">Uganda</span>
          <span className="text-xs opacity-80">Pay with Mobile Money</span>
        </Button>
        <Button
          type="button"
          variant={selected === "international" ? "default" : "outline"}
          className={`h-auto py-4 flex flex-col items-center gap-2 ${
            selected === "international" ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          onClick={() => onSelect("international")}
        >
          <Globe className="h-5 w-5" />
          <span className="font-medium">Outside Uganda</span>
          <span className="text-xs opacity-80">Pay with Card</span>
        </Button>
      </div>
    </div>
  );
}
