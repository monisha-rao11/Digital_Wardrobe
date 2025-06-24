
// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Button } from "./ui/button.tsx";
// import { ArrowRight, Check } from "lucide-react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
// import { Card } from "./ui/card.tsx";
// import { toast } from "sonner";
// import PersonalDetails from "./PersonalDetails.tsx";
// import FaceScan from "./FaceScan.tsx";
// import BodyMeasurements from "./BodyMeasurements.tsx";
// import SkinToneSlider from "./SkinToneSlider.tsx";
// import ColorPreferences from "./ColorPreferences.tsx";
// import { saveProfile } from "../services/api.ts";

// const FormContainer: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeTab, setActiveTab] = useState("personal");
//   const [formData, setFormData] = useState<any>({});

//   // Pre-fill form data if editing
//   useEffect(() => {
//     if (location.state?.formData) {
//       setFormData(location.state.formData);
//     }
//   }, [location.state]);

//   const handleNext = () => {
//     if (activeTab === "personal") {
//       // Validate personal details
//       if (!formData.name || !formData.age || !formData.gender || !formData.height || !formData.weight) {
//         toast.error("Please fill in all personal details");
//         return;
//       }
//       setActiveTab("facescan");
//     } else if (activeTab === "facescan") {
//       setActiveTab("measurements");
//     } else if (activeTab === "measurements") {
//       // Validate measurements
//       if (!formData.shoulders || !formData.bust || !formData.waist || !formData.hips) {
//         toast.error("Please fill in all body measurements");
//         return;
//       }
//       setActiveTab("skintone");
//     } else if (activeTab === "skintone") {
//       // Validate skin tone
//       if (!formData.skinTone) {
//         toast.error("Please select your skin tone");
//         return;
//       }
//       setActiveTab("colors");
//     }
//   };

//   const handlePrevious = () => {
//     if (activeTab === "facescan") {
//       setActiveTab("personal");
//     } else if (activeTab === "measurements") {
//       setActiveTab("facescan");
//     } else if (activeTab === "skintone") {
//       setActiveTab("measurements");
//     } else if (activeTab === "colors") {
//       setActiveTab("skintone");
//     }
//   };

//   const handleSubmit = async () => {
//     // Final validation
//     if (!formData.favoriteColors || formData.favoriteColors.length === 0) {
//       toast.error("Please select at least one color preference");
//       return;
//     }

//     // Calculate body type
//     calculateBodyType();
    
//     try {
//       await saveProfile(formData);
//       toast.success("Profile submitted successfully to the server!");
//       // Navigate to summary page with form data
//       navigate('/summary', { state: { formData } });
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       toast.error("Failed to save profile to server. Data saved locally only.");
//       // Still navigate to summary page even if save failed
//       navigate('/summary', { state: { formData } });
//     }
//   };

//   const calculateBodyType = () => {
//     const { gender, shoulders, bust, waist, hips } = formData;
    
//     let bodyType = "";
//     let bodyTypeFeatures = "";
    
//     if (gender === "female") {
//       // Simplified calculation for women's body types
//       const waistToHipRatio = waist / hips;
//       const bustToHipRatio = bust / hips;
//       const waistToBustRatio = waist / bust;
      
//       if (waistToHipRatio <= 0.75 && waistToBustRatio <= 0.75 && bustToHipRatio >= 0.9 && bustToHipRatio <= 1.1) {
//         bodyType = "Hourglass";
//         bodyTypeFeatures = "Bust and hips are nearly the same size with a well-defined waist";
//       } else if (bustToHipRatio < 0.9) {
//         bodyType = "Pear (Triangle)";
//         bodyTypeFeatures = "Hips wider than bust with a well-defined waist";
//       } else if (bustToHipRatio > 1.1) {
//         bodyType = "Inverted Triangle";
//         bodyTypeFeatures = "Broad shoulders, bust larger than hips";
//       } else if (waistToHipRatio > 0.8 && waistToBustRatio > 0.8) {
//         bodyType = "Rectangle (Straight)";
//         bodyTypeFeatures = "Bust, waist, and hips similar in size with little waist definition";
//       } else {
//         bodyType = "Apple (Round/Oval)";
//         bodyTypeFeatures = "Bust larger than hips with weight around midsection";
//       }
//     } else {
//       // Simplified calculation for men's body types
//       const shoulderToWaistRatio = shoulders / waist;
//       const shoulderToHipRatio = shoulders / hips;
//       const waistToHipRatio = waist / hips;
      
//       if (shoulderToWaistRatio > 1.2) {
//         bodyType = "Inverted Triangle (V-Shape)";
//         bodyTypeFeatures = "Broad shoulders, narrow waist";
//       } else if (shoulderToWaistRatio < 0.95) {
//         bodyType = "Triangle (Pear)";
//         bodyTypeFeatures = "Narrow shoulders, wider waist and hips";
//       } else if (shoulderToWaistRatio >= 0.95 && shoulderToWaistRatio <= 1.05 && 
//                 waistToHipRatio >= 0.95 && waistToHipRatio <= 1.05 &&
//                 shoulderToHipRatio >= 0.95 && shoulderToHipRatio <= 1.05) {
//         bodyType = "Rectangle";
//         bodyTypeFeatures = "Shoulders, waist, and hips are similar in width";
//       } else if (waist > shoulders && waist > hips) {
//         bodyType = "Oval (Apple)";
//         bodyTypeFeatures = "Round midsection, upper body heavier";
//       } else {
//         bodyType = "Trapezoid";
//         bodyTypeFeatures = "Balanced proportions, athletic look";
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       bodyType,
//       bodyTypeFeatures
//     }));
//   };

//   return (
//     <div className="container-base py-10">
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
//         <TabsList className="grid w-full grid-cols-5">
//           <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Personal Details
//           </TabsTrigger>
//           <TabsTrigger value="facescan" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Face Scan
//           </TabsTrigger>
//           <TabsTrigger value="measurements" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Body Measurements
//           </TabsTrigger>
//           <TabsTrigger value="skintone" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Skin Tone
//           </TabsTrigger>
//           <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Color Preferences
//           </TabsTrigger>
//         </TabsList>
        
//         <div className="mt-8">
//           <Card className="p-8 glass-card border-none">
//             <TabsContent value="personal">
//               <PersonalDetails formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="facescan">
//               <FaceScan formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="measurements">
//               <BodyMeasurements formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="skintone">
//               <SkinToneSlider formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="colors">
//               <ColorPreferences formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <div className="flex justify-between mt-8">
//               {activeTab !== "personal" && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handlePrevious}
//                   className="focus-ring"
//                 >
//                   Back
//                 </Button>
//               )}
              
//               {activeTab !== "colors" ? (
//                 <Button
//                   type="button"
//                   onClick={handleNext}
//                   className="ml-auto focus-ring group"
//                 >
//                   Continue
//                   <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//               ) : (
//                 <Button
//                   type="button"
//                   onClick={handleSubmit}
//                   className="ml-auto focus-ring group"
//                 >
//                   Submit
//                   <Check className="ml-2 h-4 w-4" />
//                 </Button>
//               )}
//             </div>
//           </Card>
//         </div>
//       </Tabs>
//     </div>
//   );
// };

// export default FormContainer;

// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Button } from "./ui/button.tsx";
// import { ArrowRight, Check, Edit3, User } from "lucide-react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
// import { Card } from "./ui/card.tsx";
// import { toast } from "sonner";
// import PersonalDetails from "./PersonalDetails.tsx";
// import FaceScan from "./FaceScan.tsx";
// import BodyMeasurements from "./BodyMeasurements.tsx";
// import SkinToneSlider from "./SkinToneSlider.tsx";
// import ColorPreferences from "./ColorPreferences.tsx";
// import { saveProfile } from "../services/api.ts";
// import { db, auth } from "../firebase.js";
// import { doc, getDoc } from "firebase/firestore";

// const FormContainer: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeTab, setActiveTab] = useState("personal");
//   const [formData, setFormData] = useState<any>({});
//   const [profileID, setProfileID] = useState<string | null>(null);
//   const [existingProfileData, setExistingProfileData] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState(false);

//   // Function to fetch profile data from Firestore
//   const fetchProfileData = async (profileId: string) => {
//     if (!profileId) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       const profileDoc = doc(db, "profiles", profileId);
//       const profileSnapshot = await getDoc(profileDoc);
      
//       if (profileSnapshot.exists()) {
//         const data = profileSnapshot.data();
//         setExistingProfileData(data);
//         setFormData(data); // Pre-populate form with existing data
//         setIsEditing(true);
//         console.log("Profile data fetched successfully:", data);
//         toast.success("Existing profile loaded for editing");
//       } else {
//         console.log("No profile document found for ID:", profileId);
//         setError("Profile not found");
//         toast.error("Profile not found");
//       }
//     } catch (error) {
//       console.error("Error fetching profile data:", error);
//       setError("Failed to fetch profile data");
//       toast.error("Failed to fetch profile data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Pre-fill form data if editing or fetch existing profile
//   useEffect(() => {
//     // Check for profile ID from various sources
//     const currentProfileID = location.state?.profileID || 
//                            localStorage.getItem("currentProfileID") || 
//                            location.state?.formData?.profileID;

//     if (currentProfileID) {
//       setProfileID(currentProfileID);
//       fetchProfileData(currentProfileID);
//     } else if (location.state?.formData) {
//       // If form data is passed directly (legacy behavior)
//       setFormData(location.state.formData);
//       setIsEditing(location.state?.isEditing || false);
//     }

//     // Check if user is authenticated
//     if (!auth.currentUser) {
//       console.error("No user is logged in.");
//       navigate("/login");
//       return;
//     }
//   }, [location.state, navigate]);

//   const handleNext = () => {
//     if (activeTab === "personal") {
//       // Validate personal details
//       if (!formData.name || !formData.age || !formData.gender || !formData.height || !formData.weight) {
//         toast.error("Please fill in all personal details");
//         return;
//       }
//       setActiveTab("facescan");
//     } else if (activeTab === "facescan") {
//       setActiveTab("measurements");
//     } else if (activeTab === "measurements") {
//       // Validate measurements
//       if (!formData.shoulders || !formData.bust || !formData.waist || !formData.hips) {
//         toast.error("Please fill in all body measurements");
//         return;
//       }
//       setActiveTab("skintone");
//     } else if (activeTab === "skintone") {
//       // Validate skin tone
//       if (!formData.skinTone) {
//         toast.error("Please select your skin tone");
//         return;
//       }
//       setActiveTab("colors");
//     }
//   };

//   const handlePrevious = () => {
//     if (activeTab === "facescan") {
//       setActiveTab("personal");
//     } else if (activeTab === "measurements") {
//       setActiveTab("facescan");
//     } else if (activeTab === "skintone") {
//       setActiveTab("measurements");
//     } else if (activeTab === "colors") {
//       setActiveTab("skintone");
//     }
//   };

//   const handleSubmit = async () => {
//     // Final validation
//     if (!formData.favoriteColors || formData.favoriteColors.length === 0) {
//       toast.error("Please select at least one color preference");
//       return;
//     }

//     // Calculate body type
//     calculateBodyType();
    
//     try {
//       // Add profileID to form data if editing
//       const submissionData = {
//         ...formData,
//         ...(profileID && { profileID }),
//         lastUpdated: new Date().toISOString()
//       };

//       await saveProfile(submissionData);
//       toast.success(isEditing ? "Profile updated successfully!" : "Profile submitted successfully to the server!");
      
//       // Navigate to summary page with form data
//       navigate('/summary', { 
//         state: { 
//           formData: submissionData,
//           isEditing 
//         } 
//       });
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       toast.error("Failed to save profile to server. Data saved locally only.");
//       // Still navigate to summary page even if save failed
//       navigate('/summary', { 
//         state: { 
//           formData: {
//             ...formData,
//             ...(profileID && { profileID })
//           },
//           isEditing 
//         } 
//       });
//     }
//   };

//   const calculateBodyType = () => {
//     const { gender, shoulders, bust, waist, hips } = formData;
    
//     let bodyType = "";
//     let bodyTypeFeatures = "";
    
//     if (gender === "female") {
//       // Simplified calculation for women's body types
//       const waistToHipRatio = waist / hips;
//       const bustToHipRatio = bust / hips;
//       const waistToBustRatio = waist / bust;
      
//       if (waistToHipRatio <= 0.75 && waistToBustRatio <= 0.75 && bustToHipRatio >= 0.9 && bustToHipRatio <= 1.1) {
//         bodyType = "Hourglass";
//         bodyTypeFeatures = "Bust and hips are nearly the same size with a well-defined waist";
//       } else if (bustToHipRatio < 0.9) {
//         bodyType = "Pear (Triangle)";
//         bodyTypeFeatures = "Hips wider than bust with a well-defined waist";
//       } else if (bustToHipRatio > 1.1) {
//         bodyType = "Inverted Triangle";
//         bodyTypeFeatures = "Broad shoulders, bust larger than hips";
//       } else if (waistToHipRatio > 0.8 && waistToBustRatio > 0.8) {
//         bodyType = "Rectangle (Straight)";
//         bodyTypeFeatures = "Bust, waist, and hips similar in size with little waist definition";
//       } else {
//         bodyType = "Apple (Round/Oval)";
//         bodyTypeFeatures = "Bust larger than hips with weight around midsection";
//       }
//     } else {
//       // Simplified calculation for men's body types
//       const shoulderToWaistRatio = shoulders / waist;
//       const shoulderToHipRatio = shoulders / hips;
//       const waistToHipRatio = waist / hips;
      
//       if (shoulderToWaistRatio > 1.2) {
//         bodyType = "Inverted Triangle (V-Shape)";
//         bodyTypeFeatures = "Broad shoulders, narrow waist";
//       } else if (shoulderToWaistRatio < 0.95) {
//         bodyType = "Triangle (Pear)";
//         bodyTypeFeatures = "Narrow shoulders, wider waist and hips";
//       } else if (shoulderToWaistRatio >= 0.95 && shoulderToWaistRatio <= 1.05 && 
//                 waistToHipRatio >= 0.95 && waistToHipRatio <= 1.05 &&
//                 shoulderToHipRatio >= 0.95 && shoulderToHipRatio <= 1.05) {
//         bodyType = "Rectangle";
//         bodyTypeFeatures = "Shoulders, waist, and hips are similar in width";
//       } else if (waist > shoulders && waist > hips) {
//         bodyType = "Oval (Apple)";
//         bodyTypeFeatures = "Round midsection, upper body heavier";
//       } else {
//         bodyType = "Trapezoid";
//         bodyTypeFeatures = "Balanced proportions, athletic look";
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       bodyType,
//       bodyTypeFeatures
//     }));
//   };

//   return (
//     <div className="container-base py-10">
//       {/* Profile Status Header */}
//       {loading && (
//         <div className="max-w-3xl mx-auto mb-6">
//           <Card className="p-4 glass-card border-none bg-blue-50">
//             <div className="flex items-center justify-center space-x-2">
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//               <span className="text-blue-800">Loading existing profile data...</span>
//             </div>
//           </Card>
//         </div>
//       )}

//       {error && (
//         <div className="max-w-3xl mx-auto mb-6">
//           <Card className="p-4 glass-card border-none bg-red-50">
//             <div className="flex items-center space-x-2">
//               <span className="text-red-800">Error: {error}</span>
//             </div>
//           </Card>
//         </div>
//       )}

//       {existingProfileData && !loading && (
//         <div className="max-w-3xl mx-auto mb-6">
//           <Card className="p-6 glass-card border-none bg-blue-50">
//             <div className="flex items-start space-x-4">
//               <div className="flex-shrink-0">
//                 <div className="p-2 bg-blue-100 rounded-full">
//                   <User className="h-5 w-5 text-blue-600" />
//                 </div>
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center justify-between mb-2">
//                   <h3 className="text-lg font-semibold text-blue-800">Profile Found</h3>
//                   <div className="flex items-center space-x-1">
//                     <Edit3 className="h-4 w-4 text-blue-600" />
//                     <span className="text-sm text-blue-600">Editing Mode</span>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                   <div>
//                     <span className="font-medium text-blue-700">Name:</span>
//                     <span className="ml-1 text-blue-800">{existingProfileData.name}</span>
//                   </div>
                  
//                   {existingProfileData.bodyType && (
//                     <div>
//                       <span className="font-medium text-green-700">Body Type:</span>
//                       <span className="ml-1 text-green-800">{existingProfileData.bodyType}</span>
//                     </div>
//                   )}
//                 </div>
//                 {profileID && (
//                   <div className="mt-2 text-xs text-blue-600">
//                     Profile ID: {profileID}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </Card>
//         </div>
//       )}

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
//         <TabsList className="grid w-full grid-cols-5">
//           <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Personal Details
//           </TabsTrigger>
//           <TabsTrigger value="facescan" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Face Scan
//           </TabsTrigger>
//           <TabsTrigger value="measurements" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Body Measurements
//           </TabsTrigger>
//           <TabsTrigger value="skintone" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Skin Tone
//           </TabsTrigger>
//           <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
//             Color Preferences
//           </TabsTrigger>
//         </TabsList>
        
//         <div className="mt-8">
//           <Card className="p-8 glass-card border-none">
//             <TabsContent value="personal">
//               <PersonalDetails formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="facescan">
//               <FaceScan formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="measurements">
//               <BodyMeasurements formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="skintone">
//               <SkinToneSlider formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <TabsContent value="colors">
//               <ColorPreferences formData={formData} setFormData={setFormData} />
//             </TabsContent>
            
//             <div className="flex justify-between mt-8">
//               {activeTab !== "personal" && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handlePrevious}
//                   className="focus-ring"
//                 >
//                   Back
//                 </Button>
//               )}
              
//               {activeTab !== "colors" ? (
//                 <Button
//                   type="button"
//                   onClick={handleNext}
//                   className="ml-auto focus-ring group"
//                 >
//                   Continue
//                   <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//               ) : (
//                 <Button
//                   type="button"
//                   onClick={handleSubmit}
//                   className="ml-auto focus-ring group"
//                 >
//                   {isEditing ? "Submit" : "Submit"}
//                   <Check className="ml-2 h-4 w-4" />
//                 </Button>
//               )}
//             </div>
//           </Card>
//         </div>
//       </Tabs>
//     </div>
//   );
// };

// export default FormContainer;


import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button.tsx";
import { ArrowRight, Check, Edit3, User, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import PersonalDetails from "./PersonalDetails.tsx";
import FaceScan from "./FaceScan.tsx";
import BodyMeasurements from "./BodyMeasurements.tsx";
import SkinToneSlider from "./SkinToneSlider.tsx";
import ColorPreferences from "./ColorPreferences.tsx";
import { saveProfile } from "../services/api.ts";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const FormContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<any>({});
  const [profileID, setProfileID] = useState<string | null>(null);
  const [existingProfileData, setExistingProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Validation error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Function to fetch profile data from Firestore
  const fetchProfileData = async (profileId: string) => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileDoc = doc(db, "profiles", profileId);
      const profileSnapshot = await getDoc(profileDoc);
      
      if (profileSnapshot.exists()) {
        const data = profileSnapshot.data();
        setExistingProfileData(data);
        setFormData(data);
        setIsEditing(true);
        toast.success("Existing profile loaded for editing");
      } else {
        setError("Profile not found");
        toast.error("Profile not found");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to fetch profile data");
      toast.error("Failed to fetch profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentProfileID = location.state?.profileID || 
                           localStorage.getItem("currentProfileID") || 
                           location.state?.formData?.profileID;

    if (currentProfileID) {
      setProfileID(currentProfileID);
      fetchProfileData(currentProfileID);
    } else if (location.state?.formData) {
      setFormData(location.state.formData);
      setIsEditing(location.state?.isEditing || false);
    }

    if (!auth.currentUser) {
      console.error("No user is logged in.");
      navigate("/login");
      return;
    }
  }, [location.state, navigate]);

  const clearValidationError = () => {
    setValidationError(null);
    setMissingFields([]);
  };

  const validatePersonalDetails = () => {
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
    return true;
  };

  const validateMeasurements = () => {
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
    return true;
  };

  const validateSkinTone = () => {
    if (!formData.skinTone) {
      setValidationError("Please select your skin tone");
      setMissingFields(["Skin Tone"]);
      return false;
    }
    return true;
  };

  const validateColorPreferences = () => {
    if (!formData.favoriteColors || formData.favoriteColors.length === 0) {
      setValidationError("Please select at least one color preference");
      setMissingFields(["Color Preferences"]);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    clearValidationError();
    
    if (activeTab === "personal") {
      if (!validatePersonalDetails()) return;
      setActiveTab("facescan");
    } else if (activeTab === "facescan") {
      setActiveTab("measurements");
    } else if (activeTab === "measurements") {
      if (!validateMeasurements()) return;
      setActiveTab("skintone");
    } else if (activeTab === "skintone") {
      if (!validateSkinTone()) return;
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

  const handleSubmit = async () => {
    clearValidationError();
    
    if (!validateColorPreferences()) return;

    calculateBodyType();
    
    try {
      const submissionData = {
        ...formData,
        ...(profileID && { profileID }),
        lastUpdated: new Date().toISOString()
      };

      await saveProfile(submissionData);
      toast.success(isEditing ? "Profile updated successfully!" : "Profile submitted successfully!");
      
      navigate('/summary', { 
        state: { 
          formData: submissionData,
          isEditing 
        } 
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
      
      navigate('/summary', { 
        state: { 
          formData: {
            ...formData,
            ...(profileID && { profileID })
          },
          isEditing 
        } 
      });
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

  return (
    <div className="container-base py-10">
      {/* Profile Status Header */}
      {loading && (
        <div className="max-w-3xl mx-auto mb-6">
          <Card className="p-4 glass-card border-none bg-blue-50">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Loading existing profile data...</span>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <div className="max-w-3xl mx-auto mb-6">
          <Card className="p-4 glass-card border-none bg-red-50">
            <div className="flex items-center space-x-2">
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
                    <span className="text-sm text-blue-600">Editing Mode</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Name:</span>
                    <span className="ml-1 text-blue-800">{existingProfileData.name}</span>
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
                        Missing fields: <strong>{missingFields.join(", ")}</strong>
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
                  {isEditing ? "Submit Profile" : "Submit"}
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