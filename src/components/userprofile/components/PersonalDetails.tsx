import React, { useState, useRef } from "react";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import { Upload, User } from "lucide-react";
import { Button } from "./ui/button.tsx";

interface PersonalDetailsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ formData, setFormData }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, gender: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData((prev: any) => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            Personal Information
          </span>
        </div>
        <h3 className="text-2xl font-display font-medium tracking-tight">Tell us about yourself</h3>
        <p className="text-muted-foreground text-sm">
          We'll use this information to provide a personalized experience
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-auto flex flex-col items-center gap-3">
          <div 
            onClick={triggerFileInput}
            className="relative group cursor-pointer"
            aria-label="Click to upload photo"
          >
            <Avatar className="w-32 h-32 border-2 border-muted group-hover:border-primary transition-colors">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="User photo" />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center">
            <Label 
              htmlFor="photo-upload" 
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-muted hover:bg-muted/80 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Label>
          </div>
          <Input 
            id="photo-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handlePhotoUpload}
            ref={fileInputRef}
          />
        </div>
        
        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Jane Doe"
                className="focus-ring"
                value={formData.name || ""}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="28"
                className="focus-ring"
                value={formData.age || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                name="occupation"
                placeholder="Software Engineer"
                className="focus-ring"
                value={formData.occupation || ""}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender || ""}
                onValueChange={handleGenderChange}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                placeholder="170"
                className="focus-ring"
                value={formData.height || ""}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                placeholder="65"
                className="focus-ring"
                value={formData.weight || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
