// utils/submitProfile.ts
import { saveProfile, uploadFaceZip } from "../lib/api.ts"; // <-- use uploadFaceZip

export const submitProfile = async (formData: any): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}> => {
  try {
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
    };

    // 1. Save profile and get profile ID
    const profileId = await saveProfile(cleanedProfileData);

    // 2. Upload ZIP of face images
    if (formData.faceZip) {
      await uploadFaceZip(profileId, formData.faceZip);
    }

    return { success: true, profileId };
  } catch (err: any) {
    console.error("Profile submission failed:", err);
    return { success: false, error: err.message };
  }
};