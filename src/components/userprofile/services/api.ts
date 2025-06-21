
// Base API URL for all requests
export const API_URL = "http://localhost:5000/api";

/**
 * Save a user profile to the backend
 * @param profileData - User profile data object
 * @returns Promise with the server response
 */
export const saveProfile = async (profileData: any) => {
  try {
    // Send POST request to the profile endpoint
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    // Check if response was successful
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    // Log and re-throw any errors
    console.error('Error saving profile:', error);
    throw error;
  }
};

/**
 * Fetch all saved profiles from the backend
 * @returns Promise with all profiles data
 */
export const getProfiles = async () => {
  try {
    // Send GET request to the profiles endpoint
    const response = await fetch(`${API_URL}/profiles`);
    
    // Check if response was successful
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    // Log and re-throw any errors
    console.error('Error fetching profiles:', error);
    throw error;
  }
};

/**
 * Fetch a specific profile by ID
 * @param id - Profile ID to retrieve
 * @returns Promise with the profile data
 */
export const getProfile = async (id: number) => {
  try {
    // Send GET request to the specific profile endpoint
    const response = await fetch(`${API_URL}/profile/${id}`);
    
    // Check if response was successful
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    // Log and re-throw any errors
    console.error('Error fetching profile:', error);
    throw error;
  }
};
