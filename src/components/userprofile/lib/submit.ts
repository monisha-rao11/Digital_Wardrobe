// import { saveProfile, uploadFaceZip } from "../lib/api.ts"; // <-- use uploadFaceZip

// export const submitProfile = async (formData: any): Promise<{
//   success: boolean;
//   profileId?: string;
//   error?: string;
// }> => {
//   try {
//     // Prepare cleaned profile payload
//     const cleanedProfileData = {
//       name: formData.name,
//       measurements: {
//         height: formData.height,
//         weight: formData.weight,
//       },
//       skinTone: formData.skinTone,
//       favoriteColors: formData.favoriteColors,
//       bodyType: formData.bodyType || null,
//     };

//     // 1. Save profile and get profile ID
//     const profileId = await saveProfile(cleanedProfileData);

//     // 2. Upload ZIP of face images
//     if (formData.faceZip) {
//       await uploadFaceZip(profileId, formData.faceZip);
//     }

//     return { success: true, profileId };
//   } catch (err: any) {
//     console.error("Profile submission failed:", err);
//     return { success: false, error: err.message };
//   }
// };


//utils/submit.ts
import { saveProfile, uploadFaceZip } from "../lib/api.ts";
import { db } from "../firebase"; // Make sure this is exported from your firebase.js
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

export interface ProfileData {
  profileID?: string;
  name: string;
  age: number;
  occupation?: string;
  gender: string;
  height: number;
  weight: number;
  shoulders: number;
  bust: number; // This will be mapped to chest
  waist: number;
  hips: number;
  skinTone: string;
  favoriteColors: string[];
  bodyType?: string;
  bodyTypeFeatures?: string;
  faceZip?: File;
  timestamp?: string;
  lastUpdated?: string;
}

export const submitProfile = async (formData: ProfileData): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}> => {
  try {
    console.log("Starting profile submission with data:", formData);

    // Generate profileID if not exists (for new profiles)
    const profileId = formData.profileID || uuidv4();

    // Prepare complete profile payload for Firestore
    const profileDataForFirestore = {
      profileID: profileId,
      fullName: formData.name,
      age: Number(formData.age),
      occupation: formData.occupation || "",
      gender: formData.gender,
      height: Number(formData.height), // Height in cm
      weight: Number(formData.weight), // Weight in kg
      shoulders: Number(formData.shoulders), // Shoulders in cm
      chest: Number(formData.bust), // Chest/Bust in cm
      waist: Number(formData.waist), // Waist in cm
      hips: Number(formData.hips), // Hips in cm
      skinTone: formData.skinTone,
      colorPreferences: formData.favoriteColors,
      bodyType: formData.bodyType || null,
      bodyTypeFeatures: formData.bodyTypeFeatures || null,
      faceDataUploaded: !!formData.faceZip, // Boolean indicating if face data was uploaded
      createdAt: formData.timestamp || new Date().toISOString(),
      lastUpdated: formData.lastUpdated || new Date().toISOString(),
    };

    console.log("Prepared profile data for Firestore:", profileDataForFirestore);

    // Check if db is properly initialized
    if (!db) {
      throw new Error("Firebase db is not initialized");
    }

    // 1. Save to Firestore first (main goal)
    console.log("Saving profile to Firestore...");
    const profileDocRef = doc(db, "profileInfo", profileId);
    await setDoc(profileDocRef, profileDataForFirestore);
    console.log("Successfully saved profile to Firestore with ID:", profileId);

    // 2. Upload face zip if exists
    if (formData.faceZip) {
      try {
        console.log("Uploading face zip...");
        await uploadFaceZip(profileId, formData.faceZip);
        console.log("Face zip uploaded successfully");
        
        // Update Firestore to indicate face data was successfully uploaded
        await setDoc(profileDocRef, {
          ...profileDataForFirestore,
          faceDataUploaded: true,
          faceDataUploadedAt: new Date().toISOString()
        }, { merge: true });
      } catch (uploadError) {
        console.warn("Face zip upload failed, but profile was saved:", uploadError);
        // Update Firestore to indicate face upload failed
        await setDoc(profileDocRef, {
          ...profileDataForFirestore,
          faceDataUploaded: false,
          faceUploadError: uploadError.message
        }, { merge: true });
      }
    }

    // 3. Optional: Save to external API (if needed for other services)
    try {
      console.log("Calling external saveProfile API...");
      await saveProfile(formData);
      console.log("External profile API called successfully");
    } catch (apiError) {
      console.warn("External API call failed, but Firestore save was successful:", apiError);
      // Don't fail the entire operation if external API fails
    }

    return { success: true, profileId };
  } catch (err: any) {
    console.error("Profile submission failed:", err);
    console.error("Error stack:", err.stack);
    return { success: false, error: err.message };
  }
};

// Helper function to validate form data before submission
export const validateProfileData = (formData: ProfileData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required field validations
  if (!formData.name?.trim()) errors.push("Full name is required");
  if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) errors.push("Valid age is required");
  if (!formData.gender?.trim()) errors.push("Gender is required");
  if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) errors.push("Valid height is required");
  if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) errors.push("Valid weight is required");
  if (!formData.shoulders || isNaN(Number(formData.shoulders)) || Number(formData.shoulders) <= 0) errors.push("Valid shoulder measurement is required");
  if (!formData.bust || isNaN(Number(formData.bust)) || Number(formData.bust) <= 0) errors.push("Valid chest/bust measurement is required");
  if (!formData.waist || isNaN(Number(formData.waist)) || Number(formData.waist) <= 0) errors.push("Valid waist measurement is required");
  if (!formData.hips || isNaN(Number(formData.hips)) || Number(formData.hips) <= 0) errors.push("Valid hips measurement is required");
  if (!formData.skinTone?.trim()) errors.push("Skin tone is required");
  if (!formData.favoriteColors || formData.favoriteColors.length === 0) errors.push("At least one color preference is required");

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Function to update existing profile
export const updateProfile = async (profileId: string, formData: ProfileData): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    console.log("Updating profile with ID:", profileId);

    const updateData = {
      fullName: formData.name,
      age: Number(formData.age),
      occupation: formData.occupation || "",
      gender: formData.gender,
      height: Number(formData.height),
      weight: Number(formData.weight),
      shoulders: Number(formData.shoulders),
      chest: Number(formData.bust),
      waist: Number(formData.waist),
      hips: Number(formData.hips),
      skinTone: formData.skinTone,
      colorPreferences: formData.favoriteColors,
      bodyType: formData.bodyType || null,
      bodyTypeFeatures: formData.bodyTypeFeatures || null,
      lastUpdated: new Date().toISOString(),
    };

    const profileDocRef = doc(db, "profileInfo", profileId);
    await setDoc(profileDocRef, updateData, { merge: true });
    
    console.log("Profile updated successfully");
    return { success: true };
  } catch (err: any) {
    console.error("Profile update failed:", err);
    return { success: false, error: err.message };
  }
};