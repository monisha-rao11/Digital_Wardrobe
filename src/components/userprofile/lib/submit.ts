// // utils/submitProfile.ts
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

// utils/submitProfile.ts
// utils/submitProfile.ts - Debugged version
import { saveProfile, uploadFaceZip } from "../lib/api.ts";
import { db } from "../firebase"; // Make sure this is exported from your firebase.js
import { doc, setDoc } from "firebase/firestore";

export const submitProfile = async (formData: any): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}> => {
  try {
    console.log("Starting profile submission with data:", formData);

    // Prepare cleaned profile payload
    const cleanedProfileData = {
      name: formData.name,
      measurements: {
        height: formData.height,
        weight: formData.weight,
      },
      skinTone: formData.skinTone,
      favoriteColors: formData.favoriteColors,
      bodyType: formData.bodyType || null,
      timestamp: new Date().toISOString(),
    };

    console.log("Cleaned profile data:", cleanedProfileData);

    // 1. Save profile (server-side or internal logic) and get profileId
    console.log("Calling saveProfile...");
    const profileId = await saveProfile(cleanedProfileData);
    console.log("Profile saved with ID:", profileId);

    // Check if profileId is valid
    if (!profileId) {
      throw new Error("Failed to get profileId from saveProfile");
    }

    // 2. Upload face zip if exists
    if (formData.faceZip) {
      console.log("Uploading face zip...");
      await uploadFaceZip(profileId, formData.faceZip);
      console.log("Face zip uploaded successfully");
    }

    // 3. Save profileInfo in Firestore under new collection with profileId as document ID
    console.log("Saving to Firestore...");
    
    // Check if db is properly initialized
    if (!db) {
      throw new Error("Firebase db is not initialized");
    }

    const profileDocRef = doc(db, "profileInfo", profileId);
    const firestoreData = {
      ...cleanedProfileData,
      profileId,
    };

    console.log("Firestore data to save:", firestoreData);
    
    await setDoc(profileDocRef, firestoreData);
    console.log("Successfully saved to Firestore");

    return { success: true, profileId };
  } catch (err: any) {
    console.error("Profile submission failed:", err);
    console.error("Error stack:", err.stack);
    return { success: false, error: err.message };
  }
};

// Common issues and solutions:

/* 
POTENTIAL ISSUES TO CHECK:

1. Firebase Configuration:
   - Make sure your firebase.js file properly exports 'db'
   - Verify Firebase project configuration
   - Check if Firestore is enabled in your Firebase console

2. Authentication:
   - If you have Firestore security rules, make sure they allow writes
   - Check if user needs to be authenticated

3. saveProfile function:
   - The saveProfile function might be failing
   - It might not be returning a valid profileId
   - Check the implementation in lib/api.ts

4. Network/Permissions:
   - Check browser console for network errors
   - Verify Firestore rules allow the operation

5. Data validation:
   - Some fields might be undefined/null causing issues
   - Firestore might reject certain data types

DEBUGGING STEPS:

1. Check your firebase.js file:
*/

// Example firebase.js that should work:
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // your config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/*
2. Check your Firestore security rules in Firebase Console:
*/

// Example rules for testing (MAKE MORE RESTRICTIVE FOR PRODUCTION):
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if true; // TEMPORARY - make restrictive later
//     }
//   }
// }

/*
3. Test the saveProfile function separately:
*/

// Test function to debug saveProfile
export const testSaveProfile = async (testData: any) => {
  try {
    console.log("Testing saveProfile with:", testData);
    const result = await saveProfile(testData);
    console.log("saveProfile returned:", result);
    return result;
  } catch (error) {
    console.error("saveProfile failed:", error);
    throw error;
  }
};

/*
4. Alternative approach - generate profileId locally if saveProfile fails:
*/

import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export const submitProfileWithFallback = async (formData: any) => {
  try {
    const cleanedProfileData = {
      name: formData.name,
      measurements: {
        height: formData.height,
        weight: formData.weight,
      },
      skinTone: formData.skinTone,
      favoriteColors: formData.favoriteColors,
      bodyType: formData.bodyType || null,
      timestamp: new Date().toISOString(),
    };

    let profileId;
    
    try {
      // Try to save profile first
      profileId = await saveProfile(cleanedProfileData);
    } catch (saveError) {
      console.warn("saveProfile failed, generating local ID:", saveError);
      // Fallback: generate local ID
      profileId = uuidv4();
    }

    // Upload face zip if exists
    if (formData.faceZip && profileId) {
      try {
        await uploadFaceZip(profileId, formData.faceZip);
      } catch (uploadError) {
        console.warn("Face zip upload failed:", uploadError);
        // Continue anyway
      }
    }

    // Save to Firestore (this is the main goal)
    const profileDocRef = doc(db, "profileInfo", profileId);
    await setDoc(profileDocRef, {
      ...cleanedProfileData,
      profileId,
    });

    return { success: true, profileId };
  } catch (err: any) {
    console.error("Profile submission failed:", err);
    return { success: false, error: err.message };
  }
};