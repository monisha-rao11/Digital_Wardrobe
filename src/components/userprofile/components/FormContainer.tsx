import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button.tsx";
import { ArrowRight, Check, Edit3, User, AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import PersonalDetails from "./PersonalDetails.tsx";
import FaceScan from "./FaceScan.tsx";
import BodyMeasurements from "./BodyMeasurements.tsx";
import SkinToneSlider from "./SkinToneSlider.tsx";
import ColorPreferences from "./ColorPreferences.tsx";
import { submitProfile, updateProfile, validateProfileData, ProfileData } from "../lib/submit.ts";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const FormContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    age: 0,
    occupation: "",
    gender: "",
    height: 0,
    weight: 0,
    shoulders: 0,
    bust: 0,
    waist: 0,
    hips: 0,
    skinTone: "",
    favoriteColors: [],
    bodyType: "",
    bodyTypeFeatures: "",
  });
  const [profileID, setProfileID] = useState<string | null>(null);
  const [existingProfileData, setExistingProfileData] = useState<any>(null);
  const [originalName, setOriginalName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Validation error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Enhanced function to fetch profile data with better error handling
  const fetchProfileData = async (profileId: string) => {
    if (!profileId) {
      setError("No profile ID provided");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Primary collection check - use profileInfo as the main collection
      let profileDoc = doc(db, "profileInfo", profileId);
      let profileSnapshot = await getDoc(profileDoc);
      
      // Fallback to legacy collection if not found
      if (!profileSnapshot.exists()) {
        console.log(`Profile not found in 'profileInfo', checking 'profiles' collection...`);
        profileDoc = doc(db, "profiles", profileId);
        profileSnapshot = await getDoc(profileDoc);
      }
      
      if (profileSnapshot.exists()) {
        const data = profileSnapshot.data();
        console.log("Profile data fetched:", data);
        
        // Standardized mapping with consistent field names
        const mappedData = {
          profileID: data.profileID || profileId,
          name: data.fullName || data.name || "",
          age: Number(data.age) || 0,
          occupation: data.occupation || "",
          gender: data.gender || "",
          height: Number(data.height) || 0,
          weight: Number(data.weight) || 0,
          shoulders: Number(data.shoulders) || 0,
          bust: Number(data.chest || data.bust) || 0, // Handle both field names
          waist: Number(data.waist) || 0,
          hips: Number(data.hips) || 0,
          skinTone: data.skinTone || "",
          favoriteColors: Array.isArray(data.colorPreferences) ? data.colorPreferences : 
                         Array.isArray(data.favoriteColors) ? data.favoriteColors : [],
          bodyType: data.bodyType || "",
          bodyTypeFeatures: data.bodyTypeFeatures || "",
        };
        
        // Store original name to prevent unauthorized changes
        setOriginalName(mappedData.name);
        setExistingProfileData(data);
        setFormData(mappedData);
        setIsEditing(true);
        
        // Update localStorage with consistent data
        localStorage.setItem("currentProfileID", profileId);
        localStorage.setItem("currentUserName", mappedData.name);
        
        toast.success("Existing profile loaded for editing");
      } else {
        const errorMsg = `Profile with ID "${profileId}" not found in either collection`;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      const errorMsg = `Failed to fetch profile data: ${error.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Enhanced profile ID resolution with priority order
    const resolveProfileID = () => {
      // Priority 1: Location state profileID
      if (location.state?.profileID) {
        return location.state.profileID;
      }
      
      // Priority 2: Location state formData profileID
      if (location.state?.formData?.profileID) {
        return location.state.formData.profileID;
      }
      
      // Priority 3: localStorage profileID
      const storedProfileID = localStorage.getItem("currentProfileID");
      if (storedProfileID) {
        return storedProfileID;
      }
      
      return null;
    };

    // Check authentication first
    if (!auth.currentUser) {
      console.error("No user is logged in.");
      navigate("/login");
      return;
    }

    const currentProfileID = resolveProfileID();
    
    if (currentProfileID) {
      console.log("Profile ID resolved:", currentProfileID);
      setProfileID(currentProfileID);
      fetchProfileData(currentProfileID);
    } else if (location.state?.formData) {
      // Handle case where form data is passed without profile ID (new profile)
      setFormData(prev => ({ ...prev, ...location.state.formData }));
      setIsEditing(location.state?.isEditing || false);
      console.log("Loading form data without profile ID (new profile)");
    } else {
      console.log("No profile ID or form data found - starting fresh");
    }
  }, [location.state, navigate]);

  // Validation and navigation functions remain the same
  const clearValidationError = () => {
    setValidationError(null);
    setMissingFields([]);
  };

  const validateCurrentTab = () => {
    clearValidationError();
    
    if (activeTab === "personal") {
      const missing = [];
      if (!formData.name?.trim()) missing.push("Name");
      if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) missing.push("Age");
      if (!formData.gender?.trim()) missing.push("Gender");
      if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) missing.push("Height");
      if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) missing.push("Weight");
      
      if (missing.length > 0) {
        setValidationError("Please fill in all required personal details");
        setMissingFields(missing);
        return false;
      }
    } else if (activeTab === "measurements") {
      const missing = [];
      if (!formData.shoulders || isNaN(Number(formData.shoulders)) || Number(formData.shoulders) <= 0) missing.push("Shoulders");
      if (!formData.bust || isNaN(Number(formData.bust)) || Number(formData.bust) <= 0) missing.push("Bust/Chest");
      if (!formData.waist || isNaN(Number(formData.waist)) || Number(formData.waist) <= 0) missing.push("Waist");
      if (!formData.hips || isNaN(Number(formData.hips)) || Number(formData.hips) <= 0) missing.push("Hips");
      
      if (missing.length > 0) {
        setValidationError("Please fill in all required body measurements");
        setMissingFields(missing);
        return false;
      }
    } else if (activeTab === "skintone") {
      if (!formData.skinTone) {
        setValidationError("Please select your skin tone");
        setMissingFields(["Skin Tone"]);
        return false;
      }
    } else if (activeTab === "colors") {
      if (!formData.favoriteColors || formData.favoriteColors.length === 0) {
        setValidationError("Please select at least one color preference");
        setMissingFields(["Color Preferences"]);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentTab()) return;
    
    if (activeTab === "personal") {
      setActiveTab("facescan");
    } else if (activeTab === "facescan") {
      setActiveTab("measurements");
    } else if (activeTab === "measurements") {
      setActiveTab("skintone");
    } else if (activeTab === "skintone") {
      setActiveTab("colors");
    }
  };

  const handlePrevious = () => {
    clearValidationError();
    
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

  const calculateBodyType = () => {
    const { gender, shoulders, bust, waist, hips } = formData;
    
    let bodyType = "";
    let bodyTypeFeatures = "";
    
    if (gender === "female") {
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

  // Enhanced username validation
  const validateNameChange = () => {
    if (isEditing && originalName && formData.name !== originalName) {
      const confirmChange = window.confirm(
        `You are changing the name from "${originalName}" to "${formData.name}". ` +
        "This will update the name across all systems. Do you want to continue?"
      );
      
      if (!confirmChange) {
        setFormData(prev => ({ ...prev, name: originalName }));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    // Validate name change if editing
    if (!validateNameChange()) {
      return;
    }

    // Final validation
    const validation = validateProfileData(formData);
    if (!validation.isValid) {
      setValidationError("Please complete all required fields");
      setMissingFields(validation.errors);
      toast.error("Please complete all required fields before submitting");
      return;
    }

    calculateBodyType();
    setSubmitting(true);
    
    try {
      const submissionData: ProfileData = {
        ...formData,
        ...(profileID && { profileID }),
        timestamp: formData.timestamp || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      let result;
      if (isEditing && profileID) {
        result = await updateProfile(profileID, submissionData);
      } else {
        result = await submitProfile(submissionData);
      }

      if (result.success) {
        const finalProfileId = result.profileId || profileID;
        
        // Update localStorage with final data
        if (finalProfileId) {
          localStorage.setItem("currentProfileID", finalProfileId);
          localStorage.setItem("currentUserName", formData.name);
        }
        
        toast.success(isEditing ? "Profile updated successfully!" : "Profile submitted successfully!");
        
        navigate('/summary', { 
          state: { 
            formData: {
              ...submissionData,
              profileID: finalProfileId
            },
            isEditing,
            profileId: finalProfileId
          } 
        });
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(`Failed to ${isEditing ? 'update' : 'save'} profile. Please try again.`);
      
      // Still navigate to summary with current data as fallback
      navigate('/summary', { 
        state: { 
          formData: {
            ...formData,
            ...(profileID && { profileID })
          },
          isEditing,
          error: error.message
        } 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-base py-10">
      {/* Profile Status Header */}
      {loading && (
        <div className="max-w-3xl mx-auto mb-6">
          <Card className="p-4 glass-card border-none bg-blue-50">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-blue-800">Loading existing profile data...</span>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <div className="max-w-3xl mx-auto mb-6">
          <Card className="p-4 glass-card border-none bg-red-50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">Error: {error}</span>
            </div>
          </Card>
        </div>
      )}

      {existingProfileData && !loading && (
        <div className="max-w-3xl mx-auto mb-6">
          <Card className="p-6 glass-card border-none bg-blue-50">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-blue-800">Profile Found</h3>
                  <div className="flex items-center space-x-1">
                    <Edit3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Profile Creation</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Name:</span>
                    <span className="ml-1 text-blue-800">{existingProfileData.fullName || existingProfileData.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Profile ID:</span>
                    <span className="ml-1 text-blue-800 font-mono text-xs">{profileID}</span>
                  </div>
                  {existingProfileData.bodyType && (
                    <div>
                      <span className="font-medium text-green-700">Body Type:</span>
                      <span className="ml-1 text-green-800">{existingProfileData.bodyType}</span>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

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
            {/* Validation Error Alert */}
            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-red-800 font-semibold mb-1">{validationError}</h4>
                    {missingFields.length > 0 && (
                      <p className="text-red-700 text-sm">
                        Missing or invalid fields: <strong>{missingFields.join(", ")}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  disabled={submitting}
                  className="focus-ring"
                >
                  Back
                </Button>
              )}
              
              {activeTab !== "colors" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="ml-auto focus-ring group"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto focus-ring group"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? "Submit Profile" : "Submit Profile"}
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
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