
import React, { useEffect } from "react";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";

interface BodyMeasurementsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

interface BodyTypeDefinition {
  gender: string;
  name: string;
  features: string;
}

const bodyTypes: BodyTypeDefinition[] = [
  { gender: 'male', name: 'Rectangle', features: 'Shoulders, waist, and hips are similar in width' },
  { gender: 'male', name: 'Triangle (Pear)', features: 'Narrow shoulders, wider waist and hips' },
  { gender: 'male', name: 'Inverted Triangle (V-Shape)', features: 'Broad shoulders, narrow waist' },
  { gender: 'male', name: 'Oval (Apple)', features: 'Round midsection, upper body heavier' },
  { gender: 'male', name: 'Trapezoid', features: 'Balanced proportions, athletic look' },
  { gender: 'female', name: 'Hourglass', features: 'Bust and hips are nearly the same size, well-defined waist' },
  { gender: 'female', name: 'Pear (Triangle)', features: 'Hips wider than bust, well-defined waist' },
  { gender: 'female', name: 'Apple (Round/Oval)', features: 'Bust larger than hips, weight around midsection' },
  { gender: 'female', name: 'Rectangle (Straight)', features: 'Bust, waist, and hips similar in size, little waist definition' },
  { gender: 'female', name: 'Inverted Triangle', features: 'Broad shoulders, bust larger than hips' },
  { gender: 'female', name: 'Diamond', features: 'Narrow shoulders and hips, weight stored around waist' }
];

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Calculate body type based on measurements and gender
  useEffect(() => {
    // Only calculate if we have all needed measurements
    const { gender, shoulders, bust, waist, hips } = formData;
    
    if (!gender || !shoulders || !bust || !waist || !hips) {
      return;
    }

    let bodyType = "";
    
    // Male body type calculation
    if (gender === "male") {
      const shoulderToWaistRatio = shoulders / waist;
      const waistToHipRatio = waist / hips;
      
      if (shoulderToWaistRatio > 1.2) {
        bodyType = "Inverted Triangle (V-Shape)";
      } else if (waistToHipRatio < 0.9) {
        bodyType = "Triangle (Pear)";
      } else if (shoulders / hips > 0.97 && shoulders / hips < 1.03) {
        bodyType = "Rectangle";
      } else if (waist > shoulders || waist > hips) {
        bodyType = "Oval (Apple)";
      } else {
        bodyType = "Trapezoid";
      }
    } 
    // Female body type calculation
    else if (gender === "female") {
      const bustToWaistRatio = bust / waist;
      const hipToWaistRatio = hips / waist;
      const bustToHipRatio = bust / hips;
      
      if (bustToWaistRatio > 1.25 && hipToWaistRatio > 1.25 && (bust / hips > 0.9 && bust / hips < 1.1)) {
        bodyType = "Hourglass";
      } else if (hipToWaistRatio > 1.25 && bustToHipRatio < 0.9) {
        bodyType = "Pear (Triangle)";
      } else if (bustToWaistRatio < 1.05 && hipToWaistRatio < 1.05) {
        bodyType = "Rectangle (Straight)";
      } else if (bustToWaistRatio > 1.25 && bustToHipRatio > 1.1) {
        bodyType = "Inverted Triangle";
      } else if (waist > bust && waist > hips) {
        bodyType = "Diamond";
      } else if (bustToWaistRatio < 1.05 && waist >= hips) {
        bodyType = "Apple (Round/Oval)";
      }
    }
    
    // Find the matching body type definition
    const bodyTypeDefinition = bodyTypes.find(type => 
      type.gender === gender && type.name === bodyType
    );

    setFormData((prev: any) => ({ 
      ...prev, 
      bodyType: bodyType,
      bodyTypeFeatures: bodyTypeDefinition?.features || ""
    }));
  }, [formData.gender, formData.shoulders, formData.bust, formData.waist, formData.hips, setFormData]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            Body Profile
          </span>
        </div>
        <h3 className="text-2xl font-display font-medium tracking-tight">Your Measurements</h3>
        <p className="text-muted-foreground text-sm">
          Enter your body measurements to determine your body type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="shoulders">Shoulders (cm)</Label>
          <Input
            id="shoulders"
            name="shoulders"
            type="number"
            placeholder="45"
            className="focus-ring"
            value={formData.shoulders || ""}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bust">{formData.gender === "female" ? "Bust" : "Chest"} (cm)</Label>
          <Input
            id="bust"
            name="bust"
            type="number"
            placeholder="90"
            className="focus-ring"
            value={formData.bust || ""}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="waist">Waist (cm)</Label>
          <Input
            id="waist"
            name="waist"
            type="number"
            placeholder="70"
            className="focus-ring"
            value={formData.waist || ""}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hips">Hips (cm)</Label>
          <Input
            id="hips"
            name="hips"
            type="number"
            placeholder="95"
            className="focus-ring"
            value={formData.hips || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      {formData.bodyType && (
        <div className="mt-8 p-5 glass-card rounded-xl">
          <div className="inline-block mb-2">
            <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
              Analysis Result
            </span>
          </div>
          <h4 className="text-lg font-medium mb-1">Your Body Type: <span className="text-primary">{formData.bodyType}</span></h4>
          <p className="text-sm text-muted-foreground">{formData.bodyTypeFeatures}</p>
        </div>
      )}
    </div>
  );
};

export default BodyMeasurements;
