
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button.tsx";
import { ArrowRight, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import PersonalDetails from "./PersonalDetails.tsx";
import FaceScan from "./FaceScan.tsx";
import BodyMeasurements from "./BodyMeasurements.tsx";
import SkinToneSlider from "./SkinToneSlider.tsx";
import ColorPreferences from "./ColorPreferences.tsx";
import { saveProfile } from "../services/api.ts";

const FormContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<any>({});

  // Pre-fill form data if editing
  useEffect(() => {
    if (location.state?.formData) {
      setFormData(location.state.formData);
    }
  }, [location.state]);

  const handleNext = () => {
    if (activeTab === "personal") {
      // Validate personal details
      if (!formData.name || !formData.age || !formData.gender || !formData.height || !formData.weight) {
        toast.error("Please fill in all personal details");
        return;
      }
      setActiveTab("facescan");
    } else if (activeTab === "facescan") {
      setActiveTab("measurements");
    } else if (activeTab === "measurements") {
      // Validate measurements
      if (!formData.shoulders || !formData.bust || !formData.waist || !formData.hips) {
        toast.error("Please fill in all body measurements");
        return;
      }
      setActiveTab("skintone");
    } else if (activeTab === "skintone") {
      // Validate skin tone
      if (!formData.skinTone) {
        toast.error("Please select your skin tone");
        return;
      }
      setActiveTab("colors");
    }
  };

  const handlePrevious = () => {
    if (activeTab === "facescan") {
      setActiveTab("personal");
    } else if (activeTab === "measurements") {
      setActiveTab("facescan");
    } else if (activeTab === "skintone") {
      setActiveTab("measurements");
    } else if (activeTab === "colors") {
      setActiveTab("skintone");
    }
  };

  const handleSubmit = async () => {
    // Final validation
    if (!formData.favoriteColors || formData.favoriteColors.length === 0) {
      toast.error("Please select at least one color preference");
      return;
    }

    // Calculate body type
    calculateBodyType();
    
    try {
      await saveProfile(formData);
      toast.success("Profile submitted successfully to the server!");
      // Navigate to summary page with form data
      navigate('/summary', { state: { formData } });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile to server. Data saved locally only.");
      // Still navigate to summary page even if save failed
      navigate('/summary', { state: { formData } });
    }
  };

  const calculateBodyType = () => {
    const { gender, shoulders, bust, waist, hips } = formData;
    
    let bodyType = "";
    let bodyTypeFeatures = "";
    
    if (gender === "female") {
      // Simplified calculation for women's body types
      const waistToHipRatio = waist / hips;
      const bustToHipRatio = bust / hips;
      const waistToBustRatio = waist / bust;
      
      if (waistToHipRatio <= 0.75 && waistToBustRatio <= 0.75 && bustToHipRatio >= 0.9 && bustToHipRatio <= 1.1) {
        bodyType = "Hourglass";
        bodyTypeFeatures = "Bust and hips are nearly the same size with a well-defined waist";
      } else if (bustToHipRatio < 0.9) {
        bodyType = "Pear (Triangle)";
        bodyTypeFeatures = "Hips wider than bust with a well-defined waist";
      } else if (bustToHipRatio > 1.1) {
        bodyType = "Inverted Triangle";
        bodyTypeFeatures = "Broad shoulders, bust larger than hips";
      } else if (waistToHipRatio > 0.8 && waistToBustRatio > 0.8) {
        bodyType = "Rectangle (Straight)";
        bodyTypeFeatures = "Bust, waist, and hips similar in size with little waist definition";
      } else {
        bodyType = "Apple (Round/Oval)";
        bodyTypeFeatures = "Bust larger than hips with weight around midsection";
      }
    } else {
      // Simplified calculation for men's body types
      const shoulderToWaistRatio = shoulders / waist;
      const shoulderToHipRatio = shoulders / hips;
      const waistToHipRatio = waist / hips;
      
      if (shoulderToWaistRatio > 1.2) {
        bodyType = "Inverted Triangle (V-Shape)";
        bodyTypeFeatures = "Broad shoulders, narrow waist";
      } else if (shoulderToWaistRatio < 0.95) {
        bodyType = "Triangle (Pear)";
        bodyTypeFeatures = "Narrow shoulders, wider waist and hips";
      } else if (shoulderToWaistRatio >= 0.95 && shoulderToWaistRatio <= 1.05 && 
                waistToHipRatio >= 0.95 && waistToHipRatio <= 1.05 &&
                shoulderToHipRatio >= 0.95 && shoulderToHipRatio <= 1.05) {
        bodyType = "Rectangle";
        bodyTypeFeatures = "Shoulders, waist, and hips are similar in width";
      } else if (waist > shoulders && waist > hips) {
        bodyType = "Oval (Apple)";
        bodyTypeFeatures = "Round midsection, upper body heavier";
      } else {
        bodyType = "Trapezoid";
        bodyTypeFeatures = "Balanced proportions, athletic look";
      }
    }
    
    setFormData(prev => ({
      ...prev,
      bodyType,
      bodyTypeFeatures
    }));
  };

  return (
    <div className="container-base py-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="facescan" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Face Scan
          </TabsTrigger>
          <TabsTrigger value="measurements" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Body Measurements
          </TabsTrigger>
          <TabsTrigger value="skintone" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Skin Tone
          </TabsTrigger>
          <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Color Preferences
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-8">
          <Card className="p-8 glass-card border-none">
            <TabsContent value="personal">
              <PersonalDetails formData={formData} setFormData={setFormData} />
            </TabsContent>
            
            <TabsContent value="facescan">
              <FaceScan formData={formData} setFormData={setFormData} />
            </TabsContent>
            
            <TabsContent value="measurements">
              <BodyMeasurements formData={formData} setFormData={setFormData} />
            </TabsContent>
            
            <TabsContent value="skintone">
              <SkinToneSlider formData={formData} setFormData={setFormData} />
            </TabsContent>
            
            <TabsContent value="colors">
              <ColorPreferences formData={formData} setFormData={setFormData} />
            </TabsContent>
            
            <div className="flex justify-between mt-8">
              {activeTab !== "personal" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="focus-ring"
                >
                  Back
                </Button>
              )}
              
              {activeTab !== "colors" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto focus-ring group"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="ml-auto focus-ring group"
                >
                  Submit
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default FormContainer;
