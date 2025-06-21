
import React, { useState, useEffect } from "react";
import { Label } from "./ui/label.tsx";
import { User } from "lucide-react";
import { Slider } from "./ui/slider.tsx";

interface SkinToneSliderProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const skinTones = [
  { value: 0, label: "Fair", description: "Very light, prone to sunburn, often found in people with Northern European ancestry" },
  { value: 20, label: "Light", description: "Slightly darker than fair, may tan a little but still burns easily" },
  { value: 40, label: "Medium", description: "Balanced skin tone, tans easily, common in people from Mediterranean, Middle Eastern, and South Asian regions" },
  { value: 60, label: "Olive", description: "Warm greenish or golden undertone, common in people of Hispanic, Middle Eastern, and South Asian descent" },
  { value: 80, label: "Tan", description: "Naturally darker than medium, tans very easily with sun exposure" },
  { value: 100, label: "Dark", description: "Rich deep brown, high melanin levels, rarely burns, common in African, Indian, and Indigenous populations" }
];

const SkinToneSlider: React.FC<SkinToneSliderProps> = ({ formData, setFormData }) => {
  const [sliderValue, setSliderValue] = useState(formData.skinToneValue || 50);
  
  // Find current skin tone based on slider value
  const getCurrentSkinTone = (value: number) => {
    return skinTones.reduce((prev, curr) => {
      return Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev;
    });
  };
  
  const currentTone = getCurrentSkinTone(sliderValue);
  
  // Update form data when slider changes
  useEffect(() => {
    setFormData((prev: any) => ({ 
      ...prev, 
      skinToneValue: sliderValue,
      skinTone: currentTone.label
    }));
  }, [sliderValue, setFormData, currentTone.label]);

  const getSkinToneColor = (value: number) => {
    if (value <= 20) return '#F8D9C2'; 
    if (value <= 40) return '#F3C6A5';
    if (value <= 60) return '#E0AC88'; 
    if (value <= 80) return '#C68E68'; 
    if (value <= 90) return '#9F7260';
    return '#6F4E42';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full">
            Skin Profile
          </span>
        </div>
        <h3 className="text-2xl font-display font-medium tracking-tight">Select your skin tone</h3>
        <p className="text-muted-foreground text-sm">
          Move the slider to match your natural skin tone
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-full w-40 h-40 flex items-center justify-center overflow-hidden mb-6 border border-slate-100 shadow-md transition-all duration-300">
            {formData.photo ? (
              <img 
                src={formData.photo} 
                alt="Your profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <User className="h-16 w-16 text-slate-300" />
              </div>
            )}
          </div>
          <div 
            className="w-24 h-24 rounded-full border-4 border-white shadow-md transition-all duration-300"
            style={{
              background: getSkinToneColor(sliderValue),
            }}
          />
        </div>
        
        <div className="md:col-span-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">
                Skin Tone: <span className="text-primary">{currentTone.label}</span>
              </h2>
              
              <div 
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm ml-2"
                style={{ backgroundColor: getSkinToneColor(sliderValue) }}
              />
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <div className="w-full h-8 rounded-full overflow-hidden flex items-center">
                  <div 
                    className="absolute top-0 left-0 w-full h-8 rounded-full -z-10"
                    style={{
                      background: 'linear-gradient(90deg, #F8D9C2 0%, #F3C6A5 20%, #E0AC88 40%, #C68E68 60%, #9F7260 80%, #6F4E42 100%)'
                    }}
                  />
                  <Slider
                    value={[sliderValue]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setSliderValue(value[0])}
                    className="z-10 h-8"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                {skinTones.map((tone) => (
                  <div key={tone.value} className="text-center flex-1">
                    {tone.label}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-5 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm">
                <p className="text-lg font-medium mb-2">{currentTone.label}</p>
                <p className="text-gray-600">{currentTone.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinToneSlider;
