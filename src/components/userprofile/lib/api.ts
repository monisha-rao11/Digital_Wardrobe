import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// 1. Save profile data (JSON only)
export const saveProfile = async (formData: any): Promise<string> => {
  try {
    const { faceImages, ...profileData } = formData; // exclude zip or file data
    const response = await axios.post(`${BASE_URL}/profile`, profileData);
    return response.data.id; // Return the profile ID
  } catch (err) {
    console.error("Error saving profile:", err);
    throw err;
  }
};

// 2. Upload zipped face images
export const uploadFaceZip = async (profileId: string, zipFile: File) => {
  try {
    const formData = new FormData();
    formData.append("file", zipFile);
    formData.append("profile_id", profileId);

    await axios.post(`${BASE_URL}/upload-face`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (err) {
    console.error("Error uploading face ZIP:", err);
    throw err;
  }
};
