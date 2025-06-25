// // import { saveProfile, uploadFaceZip } from "../lib/api.ts"; // <-- use uploadFaceZip

// // export const submitProfile = async (formData: any): Promise<{
// //   success: boolean;
// //   profileId?: string;
// //   error?: string;
// // }> => {
// //   try {
// //     // Prepare cleaned profile payload
// //     const cleanedProfileData = {
// //       name: formData.name,
// //       measurements: {
// //         height: formData.height,
// //         weight: formData.weight,
// //       },
// //       skinTone: formData.skinTone,
// //       favoriteColors: formData.favoriteColors,
// //       bodyType: formData.bodyType || null,
// //     };

// //     // 1. Save profile and get profile ID
// //     const profileId = await saveProfile(cleanedProfileData);

// //     // 2. Upload ZIP of face images
// //     if (formData.faceZip) {
// //       await uploadFaceZip(profileId, formData.faceZip);
// //     }

// //     return { success: true, profileId };
// //   } catch (err: any) {
// //     console.error("Profile submission failed:", err);
// //     return { success: false, error: err.message };
// //   }
// // };


// //utils/submit.ts
// import { saveProfile, uploadFaceZip } from "../lib/api.ts";
// import { db } from "../firebase"; // Make sure this is exported from your firebase.js
// import { doc, setDoc, collection, addDoc } from "firebase/firestore";
// import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

// export interface ProfileData {
//   profileID?: string;
//   name: string;
//   age: number;
//   occupation?: string;
//   gender: string;
//   height: number;
//   weight: number;
//   shoulders: number;
//   bust: number; // This will be mapped to chest
//   waist: number;
//   hips: number;
//   skinTone: string;
//   favoriteColors: string[];
//   bodyType?: string;
//   bodyTypeFeatures?: string;
//   faceZip?: File;
//   timestamp?: string;
//   lastUpdated?: string;
// }

// export const submitProfile = async (formData: ProfileData): Promise<{
//   success: boolean;
//   profileId?: string;
//   error?: string;
// }> => {
//   try {
//     console.log("Starting profile submission with data:", formData);

//     // Generate profileID if not exists (for new profiles)
//     const profileId = formData.profileID || uuidv4();

//     // Prepare complete profile payload for Firestore
//     const profileDataForFirestore = {
//       profileID: profileId,
//       fullName: formData.name,
//       age: Number(formData.age),
//       occupation: formData.occupation || "",
//       gender: formData.gender,
//       height: Number(formData.height), // Height in cm
//       weight: Number(formData.weight), // Weight in kg
//       shoulders: Number(formData.shoulders), // Shoulders in cm
//       chest: Number(formData.bust), // Chest/Bust in cm
//       waist: Number(formData.waist), // Waist in cm
//       hips: Number(formData.hips), // Hips in cm
//       skinTone: formData.skinTone,
//       colorPreferences: formData.favoriteColors,
//       bodyType: formData.bodyType || null,
//       bodyTypeFeatures: formData.bodyTypeFeatures || null,
//       faceDataUploaded: !!formData.faceZip, // Boolean indicating if face data was uploaded
//       createdAt: formData.timestamp || new Date().toISOString(),
//       lastUpdated: formData.lastUpdated || new Date().toISOString(),
//     };

//     console.log("Prepared profile data for Firestore:", profileDataForFirestore);

//     // Check if db is properly initialized
//     if (!db) {
//       throw new Error("Firebase db is not initialized");
//     }

//     // 1. Save to Firestore first (main goal)
//     console.log("Saving profile to Firestore...");
//     const profileDocRef = doc(db, "profileInfo", profileId);
//     await setDoc(profileDocRef, profileDataForFirestore);
//     console.log("Successfully saved profile to Firestore with ID:", profileId);

//     // 2. Upload face zip if exists
//     if (formData.faceZip) {
//       try {
//         console.log("Uploading face zip...");
//         await uploadFaceZip(profileId, formData.faceZip);
//         console.log("Face zip uploaded successfully");
        
//         // Update Firestore to indicate face data was successfully uploaded
//         await setDoc(profileDocRef, {
//           ...profileDataForFirestore,
//           faceDataUploaded: true,
//           faceDataUploadedAt: new Date().toISOString()
//         }, { merge: true });
//       } catch (uploadError) {
//         console.warn("Face zip upload failed, but profile was saved:", uploadError);
//         // Update Firestore to indicate face upload failed
//         await setDoc(profileDocRef, {
//           ...profileDataForFirestore,
//           faceDataUploaded: false,
//           faceUploadError: uploadError.message
//         }, { merge: true });
//       }
//     }

//     // 3. Optional: Save to external API (if needed for other services)
//     try {
//       console.log("Calling external saveProfile API...");
//       await saveProfile(formData);
//       console.log("External profile API called successfully");
//     } catch (apiError) {
//       console.warn("External API call failed, but Firestore save was successful:", apiError);
//       // Don't fail the entire operation if external API fails
//     }

//     return { success: true, profileId };
//   } catch (err: any) {
//     console.error("Profile submission failed:", err);
//     console.error("Error stack:", err.stack);
//     return { success: false, error: err.message };
//   }
// };

// // Helper function to validate form data before submission
// export const validateProfileData = (formData: ProfileData): { isValid: boolean; errors: string[] } => {
//   const errors: string[] = [];

//   // Required field validations
//   if (!formData.name?.trim()) errors.push("Full name is required");
//   if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) errors.push("Valid age is required");
//   if (!formData.gender?.trim()) errors.push("Gender is required");
//   if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) errors.push("Valid height is required");
//   if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) errors.push("Valid weight is required");
//   if (!formData.shoulders || isNaN(Number(formData.shoulders)) || Number(formData.shoulders) <= 0) errors.push("Valid shoulder measurement is required");
//   if (!formData.bust || isNaN(Number(formData.bust)) || Number(formData.bust) <= 0) errors.push("Valid chest/bust measurement is required");
//   if (!formData.waist || isNaN(Number(formData.waist)) || Number(formData.waist) <= 0) errors.push("Valid waist measurement is required");
//   if (!formData.hips || isNaN(Number(formData.hips)) || Number(formData.hips) <= 0) errors.push("Valid hips measurement is required");
//   if (!formData.skinTone?.trim()) errors.push("Skin tone is required");
//   if (!formData.favoriteColors || formData.favoriteColors.length === 0) errors.push("At least one color preference is required");

//   return {
//     isValid: errors.length === 0,
//     errors
//   };
// };

// // Function to update existing profile
// export const updateProfile = async (profileId: string, formData: ProfileData): Promise<{
//   success: boolean;
//   error?: string;
// }> => {
//   try {
//     console.log("Updating profile with ID:", profileId);

//     const updateData = {
//       fullName: formData.name,
//       age: Number(formData.age),
//       occupation: formData.occupation || "",
//       gender: formData.gender,
//       height: Number(formData.height),
//       weight: Number(formData.weight),
//       shoulders: Number(formData.shoulders),
//       chest: Number(formData.bust),
//       waist: Number(formData.waist),
//       hips: Number(formData.hips),
//       skinTone: formData.skinTone,
//       colorPreferences: formData.favoriteColors,
//       bodyType: formData.bodyType || null,
//       bodyTypeFeatures: formData.bodyTypeFeatures || null,
//       lastUpdated: new Date().toISOString(),
//     };

//     const profileDocRef = doc(db, "profileInfo", profileId);
//     await setDoc(profileDocRef, updateData, { merge: true });
    
//     console.log("Profile updated successfully");
//     return { success: true };
//   } catch (err: any) {
//     console.error("Profile update failed:", err);
//     return { success: false, error: err.message };
//   }
// };



// utils/submit.ts
import { saveProfile } from "../lib/api.ts";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface ProfileData {
  profileID?: string;
  name: string;
  age: number;
  occupation?: string;
  gender: string;
  height: number;
  weight: number;
  shoulders: number;
  bust: number;
  waist: number;
  hips: number;
  skinTone: string;
  favoriteColors: string[];
  bodyType?: string;
  bodyTypeFeatures?: string;
  faceZip?: File;
  profileImage?: File | string | null;
  profileImageUrl?: string;
  timestamp?: string;
  lastUpdated?: string;
}

/**
 * Upload profile image to Firebase Storage
 * @param profileImage - File to upload
 * @param userID - Current user ID
 * @param profileId - Profile ID
 * @param userName - User's name for filename
 * @returns Promise<string | null> - Download URL or null if failed
 */
const uploadProfileImageToStorage = async (
  profileImage: File,
  userID: string,
  profileId: string,
  userName: string
): Promise<string | null> => {
  try {
    console.log("Starting profile image upload process...");
    console.log("Profile image file details:", {
      name: profileImage.name,
      size: profileImage.size,
      type: profileImage.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(profileImage.type)) {
      throw new Error(`Invalid file type: ${profileImage.type}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (profileImage.size > maxSize) {
      throw new Error(`File size too large: ${profileImage.size} bytes. Maximum allowed: ${maxSize} bytes`);
    }

    // Get Firebase Storage instance
    const storage = getStorage();
    if (!storage) {
      throw new Error("Firebase Storage is not initialized");
    }

    // Create safe filename using user's name
    const fileExtension = profileImage.name.split('.').pop() || 'jpg';
    const sanitizedUserName = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const safeFilename = `${sanitizedUserName}_profile_${timestamp}.${fileExtension}`;
    
    // Create storage path: wardrobe/{userID}/{profileID}/profileInfo/{filename}
    const storagePath = `wardrobe/${userID}/${profileId}/profileInfo/${safeFilename}`;
    console.log("Storage path:", storagePath);

    // Create storage reference
    const storageRef = ref(storage, storagePath);
    console.log("Storage reference created successfully");

    // Upload file to Firebase Storage
    console.log("Starting file upload to Firebase Storage...");
    const uploadResult = await uploadBytes(storageRef, profileImage);
    console.log("File uploaded successfully. Upload result metadata:", {
      name: uploadResult.metadata.name,
      size: uploadResult.metadata.size,
      contentType: uploadResult.metadata.contentType
    });

    // Get download URL
    console.log("Getting download URL...");
    const downloadURL = await getDownloadURL(storageRef);
    console.log("Profile image uploaded successfully. Download URL:", downloadURL);

    // Verify the URL is valid
    if (!downloadURL || !downloadURL.startsWith('https://')) {
      throw new Error("Invalid download URL received from Firebase Storage");
    }

    return downloadURL;

  } catch (uploadError: any) {
    console.error("Profile image upload failed with detailed error:");
    console.error("Error message:", uploadError.message);
    console.error("Error code:", uploadError.code);
    console.error("Error stack:", uploadError.stack);

    // Specific error handling for Firebase Storage errors
    if (uploadError.code === 'storage/unauthorized') {
      console.error("Storage upload failed: User unauthorized. Check Firebase Storage rules.");
    } else if (uploadError.code === 'storage/quota-exceeded') {
      console.error("Storage upload failed: Quota exceeded.");
    } else if (uploadError.code === 'storage/invalid-format') {
      console.error("Storage upload failed: Invalid file format.");
    } else if (uploadError.code === 'storage/invalid-argument') {
      console.error("Storage upload failed: Invalid argument provided.");
    } else if (uploadError.message.includes('not authenticated')) {
      console.error("Storage upload failed: Authentication issue.");
    } else {
      console.error("Storage upload failed: Unknown error.");
    }

    return null;
  }
};

/**
 * Upload face data to Firebase Storage
 * @param faceZip - Face data file
 * @param userID - Current user ID
 * @param profileId - Profile ID
 * @returns Promise<string | null> - Download URL or null if failed
 */
const uploadFaceDataToStorage = async (
  faceZip: File,
  userID: string,
  profileId: string
): Promise<string | null> => {
  try {
    const safeFilename = faceZip.name.replace(/\s/g, "_");
    const storagePath = `wardrobe/${userID}/${profileId}/profileInfo/${safeFilename}`;
    
    const storage = getStorage();
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, faceZip);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log("Face data uploaded successfully. URL:", downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.warn("Face data upload failed:", error);
    return null;
  }
};

export const submitProfile = async (formData: ProfileData): Promise<{
  success: boolean;
  profileId?: string;
  profileImageUrl?: string;
  error?: string;
}> => {
  try {
    console.log("Starting profile submission with data:", formData);
    
    // Validate user authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const profileId = formData.profileID || uuidv4();
    const userID = user.uid;
    let profileImageUrl: string | null = formData.profileImageUrl || null;

    // Upload profile image to Firebase Storage if present
    if (formData.profileImage && formData.profileImage instanceof File) {
      console.log("Profile image detected, starting upload process...");
      profileImageUrl = await uploadProfileImageToStorage(
        formData.profileImage,
        userID,
        profileId,
        formData.name
      );
      
      if (!profileImageUrl) {
        console.warn("Profile image upload failed, continuing without image");
      }
    }

    // Prepare profile data for Firestore
    const profileDataForFirestore = {
      profileID: profileId,
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
      profileImageUrl: profileImageUrl,
      faceDataUploaded: !!formData.faceZip,
      createdAt: formData.timestamp || new Date().toISOString(),
      lastUpdated: formData.lastUpdated || new Date().toISOString(),
    };

    // Save profile data to Firestore
    const profileDocRef = doc(db, "profileInfo", profileId);
    await setDoc(profileDocRef, profileDataForFirestore);
    console.log("Profile data saved in Firestore:", profileId);

    // Upload face data if present
    if (formData.faceZip) {
      const faceDataURL = await uploadFaceDataToStorage(formData.faceZip, userID, profileId);
      
      if (faceDataURL) {
        await setDoc(profileDocRef, {
          faceDataUploaded: true,
          faceDataUploadedAt: new Date().toISOString(),
          faceDataURL: faceDataURL,
        }, { merge: true });
      } else {
        await setDoc(profileDocRef, {
          faceDataUploaded: false,
          faceUploadError: "Upload failed",
        }, { merge: true });
      }
    }

    // External API call
    try {
      await saveProfile(formData);
      console.log("External API call successful");
    } catch (apiError) {
      console.warn("External API call failed:", apiError);
    }

    return { 
      success: true, 
      profileId,
      profileImageUrl: profileImageUrl || undefined
    };

  } catch (err: any) {
    console.error("Profile submission failed:", err);
    return { success: false, error: err.message };
  }
};

export const updateProfile = async (profileId: string, formData: ProfileData): Promise<{
  success: boolean;
  profileId?: string;
  profileImageUrl?: string;
  error?: string;
}> => {
  try {
    console.log("Starting profile update with data:", formData);
    
    // Validate user authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userID = user.uid;
    let profileImageUrl: string | null = formData.profileImageUrl || null;

    // Upload new profile image if present
    if (formData.profileImage && formData.profileImage instanceof File) {
      console.log("New profile image detected, starting upload process...");
      profileImageUrl = await uploadProfileImageToStorage(
        formData.profileImage,
        userID,
        profileId,
        formData.name
      );
      
      if (!profileImageUrl) {
        console.warn("Profile image upload failed, keeping existing image");
        profileImageUrl = formData.profileImageUrl || null;
      }
    }

    // Prepare updated profile data for Firestore
    const profileDataForFirestore = {
      profileID: profileId,
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
      profileImageUrl: profileImageUrl,
      faceDataUploaded: !!formData.faceZip,
      lastUpdated: new Date().toISOString(),
    };

    // Update profile data in Firestore
    const profileDocRef = doc(db, "profileInfo", profileId);
    await setDoc(profileDocRef, profileDataForFirestore, { merge: true });
    console.log("Profile data updated in Firestore:", profileId);

    // Handle face data upload if present
    if (formData.faceZip) {
      const faceDataURL = await uploadFaceDataToStorage(formData.faceZip, userID, profileId);
      
      if (faceDataURL) {
        await setDoc(profileDocRef, {
          faceDataUploaded: true,
          faceDataUploadedAt: new Date().toISOString(),
          faceDataURL: faceDataURL,
        }, { merge: true });
      } else {
        await setDoc(profileDocRef, {
          faceDataUploaded: false,
          faceUploadError: "Upload failed",
        }, { merge: true });
      }
    }

    return { 
      success: true, 
      profileId,
      profileImageUrl: profileImageUrl || undefined
    };

  } catch (err: any) {
    console.error("Profile update failed:", err);
    return { success: false, error: err.message };
  }
};

export const validateProfileData = (formData: ProfileData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!formData.name?.trim()) errors.push("Name");
  if (!formData.age || formData.age <= 0) errors.push("Age");
  if (!formData.gender?.trim()) errors.push("Gender");
  if (!formData.height || formData.height <= 0) errors.push("Height");
  if (!formData.weight || formData.weight <= 0) errors.push("Weight");
  if (!formData.shoulders || formData.shoulders <= 0) errors.push("Shoulders");
  if (!formData.bust || formData.bust <= 0) errors.push("Bust/Chest");
  if (!formData.waist || formData.waist <= 0) errors.push("Waist");
  if (!formData.hips || formData.hips <= 0) errors.push("Hips");
  if (!formData.skinTone?.trim()) errors.push("Skin Tone");
  if (!formData.favoriteColors || formData.favoriteColors.length === 0) errors.push("Color Preferences");
  
  return {
    isValid: errors.length === 0,
    errors
  };
};