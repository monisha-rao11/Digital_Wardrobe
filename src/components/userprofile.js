<<<<<<< HEAD
=======

>>>>>>> 93ee2876e8802566d71bbbb40a01f0473faae625
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  
  // State management
  const [userName, setUserName] = useState(
    location.state?.name || localStorage.getItem("currentUserName") || "User"
  );
  const [profileID, setProfileID] = useState(
    location.state?.profileID || localStorage.getItem("currentProfileID") || null
  );
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Store profile information
    if (location.state?.profileID && location.state?.name) {
      localStorage.setItem("currentProfileID", location.state.profileID);
      localStorage.setItem("currentUserName", location.state.name);
      setUserName(location.state.name);
      setProfileID(location.state.profileID);
    }

    fetchProfileData();
  }, [user, navigate, location.state, profileID]);

  const fetchProfileData = async () => {
    if (!profileID) {
      setError("No profile ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileRef = doc(db, "profileInfo", profileID);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setProfileData(profileSnap.data());
        setError(null);
      } else {
        setError("Profile not found");
      }
    } catch (err) {
      setError("Error fetching profile data");
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const formData = profileData ? {
      profileID: profileData.profileID,
      name: profileData.fullName,
      age: profileData.age,
      occupation: profileData.occupation,
      gender: profileData.gender,
      height: profileData.height,
      weight: profileData.weight,
      shoulders: profileData.shoulders,
      bust: profileData.chest,
      waist: profileData.waist,
      hips: profileData.hips,
      skinTone: profileData.skinTone,
      favoriteColors: profileData.colorPreferences,
      bodyType: profileData.bodyType,
      bodyTypeFeatures: profileData.bodyTypeFeatures
    } : null;

    navigate("/form", { 
      state: { 
        formData: formData,
        profileID: profileID,
        isEdit: true
      } 
    });
  };

  const handleDashboard = () => {
    navigate("/dashboard", {
      state: { name: userName, profileID: profileID }
    });
  };

  const downloadCSV = () => {
    if (!profileData) return;
    
    const headers = Object.keys(profileData).join(",");
    const values = Object.values(profileData).map(value => 
      Array.isArray(value) ? value.join(';') : value
    ).join(",");
    const csv = `${headers}\n${values}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profileData.fullName?.replace(/\s+/g, "_") || 'profile'}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.contentWrapper}>
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.contentWrapper}>
          <div style={styles.error}>
            <h3>Error</h3>
            <p>{error}</p>
            <div style={styles.buttonGroup}>
              <button style={styles.button} onClick={fetchProfileData}>
                Retry
              </button>
              <button style={styles.buttonSecondary} onClick={handleDashboard}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.contentWrapper}>
          <div style={styles.error}>
            <h3>No Profile Data</h3>
            <p>No profile information found.</p>
            <button style={styles.button} onClick={() => navigate("/form")}>
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.contentWrapper}>
        <div style={styles.card}>
          {/* Header with Name and Profile ID */}
          <div style={styles.header}>
            <h2 style={styles.title}>{userName}</h2>
            <p style={styles.profileId}>Profile ID: {profileID}</p>
          </div>

          {/* Profile Content */}
          <div style={styles.content}>
            {/* Personal Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal Information</h3>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <span style={styles.label}>Full Name:</span>
                  <span style={styles.value}>{profileData.fullName}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Age:</span>
                  <span style={styles.value}>{profileData.age}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Gender:</span>
                  <span style={styles.value}>{profileData.gender}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Occupation:</span>
                  <span style={styles.value}>{profileData.occupation || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Physical Attributes */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Physical Attributes</h3>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <span style={styles.label}>Height:</span>
                  <span style={styles.value}>{profileData.height} cm</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Weight:</span>
                  <span style={styles.value}>{profileData.weight} kg</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Shoulders:</span>
                  <span style={styles.value}>{profileData.shoulders} cm</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>{profileData.gender === "female" ? "Bust" : "Chest"}:</span>
                  <span style={styles.value}>{profileData.chest} cm</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Waist:</span>
                  <span style={styles.value}>{profileData.waist} cm</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.label}>Hips:</span>
                  <span style={styles.value}>{profileData.hips} cm</span>
                </div>
              </div>
            </div>

            {/* Body Type */}
            {profileData.bodyType && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Body Type</h3>
                <div style={styles.field}>
                  <span style={styles.label}>Type:</span>
                  <span style={styles.value}>{profileData.bodyType}</span>
                </div>
                {profileData.bodyTypeFeatures && (
                  <div style={styles.field}>
                    <span style={styles.label}>Features:</span>
                    <span style={styles.value}>{profileData.bodyTypeFeatures}</span>
                  </div>
                )}
              </div>
            )}

            {/* Skin Tone */}
            {profileData.skinTone && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Skin Tone</h3>
                <div style={styles.field}>
                  <span style={styles.label}>Tone:</span>
                  <span style={styles.value}>{profileData.skinTone}</span>
                </div>
              </div>
            )}

            {/* Color Preferences */}
            {profileData.colorPreferences && profileData.colorPreferences.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Color Preferences</h3>
                <div style={styles.colorGrid}>
                  {profileData.colorPreferences.map((color, index) => (
                    <div 
                      key={index} 
                      style={{
                        ...styles.colorSwatch,
                        backgroundColor: color
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Profile Metadata */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Profile Metadata</h3>
              <div style={styles.grid}>
                {profileData.createdAt && (
                  <div style={styles.field}>
                    <span style={styles.label}>Created:</span>
                    <span style={styles.value}>
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profileData.lastUpdated && (
                  <div style={styles.field}>
                    <span style={styles.label}>Last Updated:</span>
                    <span style={styles.value}>
                      {new Date(profileData.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button style={styles.button} onClick={handleEdit}>
              Edit Profile
            </button>
            <button style={styles.buttonSecondary} onClick={downloadCSV}>
              Download Data
            </button>
            <button style={styles.button} onClick={handleDashboard}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  
  contentWrapper: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
  },
  
  card: {
    maxWidth: "800px",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)",
    border: "1px solid rgba(33, 150, 243, 0.3)",
    overflow: "hidden"
  },
  
  header: {
    backgroundColor: "rgba(33, 150, 243, 0.9)",
    color: "white",
    padding: "24px",
    textAlign: "center"
  },
  
  title: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "600",
    textShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)"
  },
  
  profileId: {
    margin: "0",
    fontSize: "14px",
    opacity: "0.9"
  },
  
  content: {
    padding: "24px"
  },
  
  section: {
    marginBottom: "32px"
  },
  
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1976d2",
    borderBottom: "2px solid rgba(33, 150, 243, 0.3)",
    paddingBottom: "8px"
  },
  
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px"
  },
  
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(33, 150, 243, 0.2)"
  },
  
  label: {
    fontWeight: "500",
    color: "#1976d2"
  },
  
  value: {
    color: "#424242",
    textAlign: "right"
  },
  
  colorGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  
  colorSwatch: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    border: "1px solid rgba(33, 150, 243, 0.3)"
  },
  
  actions: {
    padding: "24px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTop: "1px solid rgba(33, 150, 243, 0.2)",
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  
  button: {
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    fontWeight: "bold"
  },
  
  buttonSecondary: {
    backgroundColor: "#FFFFFF",
    color: "#2196f3",
    border: "2px solid #2196f3",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "16px"
  },
  
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
    color: "#1976d2",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    padding: "40px",
    boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)"
  },
  
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid rgba(33, 150, 243, 0.3)",
    borderTop: "3px solid #2196f3",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  
  error: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "32px",
    borderRadius: "15px",
    textAlign: "center",
    maxWidth: "400px",
    margin: "0 auto",
    boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)",
    border: "1px solid rgba(33, 150, 243, 0.3)",
    color: "#1976d2"
  }
};

export default UserProfile;