import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

const Profiles = () => {
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, "profiles"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const profileData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProfiles(profileData);
        console.log("Profiles fetched:", profileData);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [user]);

  // Navigate to PIN entry page with clear profile identification
  const handleProfileClick = (profile) => {
    // Store selected profile ID in localStorage to maintain state
    localStorage.setItem("selectedProfileID", profile.id);
    localStorage.setItem("selectedProfileName", profile.name);
    
    // Navigate to PIN entry with clear profile data
    navigate("/enter-pin", { 
      state: { 
        profile: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          // Include any other necessary profile data
        } 
      } 
    });
  };

  // Navigate to Edit Profile Page via PIN entry
  const handleEditProfile = (profile) => {
    // Store the action and profile data for after PIN verification
    localStorage.setItem("pendingAction", "edit");
    localStorage.setItem("selectedProfileID", profile.id);
    localStorage.setItem("selectedProfileName", profile.name);
    localStorage.setItem("selectedProfileData", JSON.stringify(profile));
    
    // Navigate to PIN entry with edit action
    navigate("/enter-pin", { 
      state: { 
        profile: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        },
        action: "edit",
        returnTo: "/create-profile"
      } 
    });
  };

  // Handle Profile Deletion via PIN entry
  const handleDeleteProfile = (profile) => {
    // Store the action and profile data for after PIN verification
    localStorage.setItem("pendingAction", "delete");
    localStorage.setItem("selectedProfileID", profile.id);
    localStorage.setItem("selectedProfileName", profile.name);
    localStorage.setItem("selectedProfileData", JSON.stringify(profile));
    
    // Navigate to PIN entry with delete action
    navigate("/enter-pin", { 
      state: { 
        profile: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        },
        action: "delete",
        returnTo: "/profiles"
      } 
    });
  };

  // Handle Profile Creation
  const handleCreateProfile = () => {
    navigate("/create-profile");
  };

  return (
    <div style={styles.container}>
      {/* Dark gradient overlay */}
      <div style={styles.overlay}></div>
      
      {/* Header section */}
      <div style={styles.header}></div>
      
      {/* Main content with scrollable area */}
      <div style={styles.contentWrapper}>
        <h1 style={styles.pageTitle}>Who's Dressing Up Today?</h1>
        
        <div style={styles.profileContainer}>
          {profiles.map((profile) => (
            <div key={profile.id} style={styles.profileCard} onClick={() => handleProfileClick(profile)}>
              <img src={profile.avatar} alt="Avatar" style={styles.avatar} />
              <p style={styles.profileName}>{profile.name}</p>

              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent profile selection on edit click
                  handleEditProfile(profile);
                }}
                style={styles.editButton}
              >
                ✏️ Edit
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent profile selection on delete click
                  handleDeleteProfile(profile);
                }}
                style={styles.deleteButton}
              >
                🗑️ Delete
              </button>
            </div>
          ))}

          {/* Add Profile Card */}
          <div style={styles.addProfileCard} onClick={handleCreateProfile}>
            <p style={styles.addIcon}>+</p>
            <p style={styles.addText}>Add Profile</p>
          </div>
        </div>
      </div>
      
      {/* Bottom navigation */}
      <div style={styles.bottomNav}></div>
    </div>
  );
};

// Updated styling with blue color scheme
const styles = {
  container: { 
    textAlign: "center",
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)",
    position: "relative",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
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
    flex: 1,
    overflowY: "auto",
    position: "relative",
    zIndex: 2,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },
  
  profileContainer: { 
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "20px",
    justifyItems: "center",
    marginTop: "20px",
    maxWidth: "1200px",
    margin: "20px auto 0 auto",
    padding: "0 20px",
  },

  profileCard: { 
    width: "160px", 
    height: "240px", 
    backgroundColor: "rgba(255, 255, 255, 0.9)", 
    border: "1px solid rgba(33, 150, 243, 0.3)", 
    borderRadius: "15px", 
    padding: "15px", 
    cursor: "pointer", 
    position: "relative", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.3)",
    backdropFilter: "blur(10px)",
  },

  avatar: { 
    width: "80px", 
    height: "80px", 
    borderRadius: "50%", 
    border: "3px solid #2196F3",
    boxShadow: "0 0 15px rgba(33, 150, 243, 0.5)",
    objectFit: "cover",
  },

  profileName: {
    color: "#1976D2",
    fontSize: "14px",
    fontWeight: "bold",
    margin: "8px 0",
    textAlign: "center",
    wordBreak: "break-word",
    lineHeight: "1.2",
  },

  editButton: { 
    backgroundColor: "#2196F3", 
    color: "#FFFFFF", 
    border: "none", 
    padding: "6px 12px", 
    borderRadius: "6px", 
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    transition: "all 0.2s ease",
    marginBottom: "4px",
    width: "100%",
  },

  deleteButton: { 
    backgroundColor: "#F44336", 
    color: "#FFFFFF", 
    border: "none", 
    padding: "6px 12px", 
    borderRadius: "6px", 
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    transition: "all 0.2s ease",
    width: "100%",
  },

  addProfileCard: { 
    width: "160px", 
    height: "240px", 
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    border: "2px dashed rgba(33, 150, 243, 0.6)", 
    borderRadius: "15px", 
    display: "flex", 
    flexDirection: "column",
    justifyContent: "center", 
    alignItems: "center", 
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(5px)",
  },
  
  addIcon: {
    fontSize: "40px",
    color: "#2196F3",
    margin: "0 0 8px 0",
    fontWeight: "bold",
  },
  
  addText: {
    color: "#1976D2",
    fontSize: "14px",
    fontWeight: "bold",
    margin: "0",
  },
  
  pageTitle: {
    color: "#1976D2",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
    textShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottom: "1px solid rgba(33, 150, 243, 0.3)",
    padding: "15px 20px",
    position: "relative",
    zIndex: 2,
    backdropFilter: "blur(10px)",
  },
  
  bottomNav: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTop: "1px solid rgba(33, 150, 243, 0.3)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    padding: "15px 0",
    position: "relative",
    zIndex: 2,
    backdropFilter: "blur(10px)",
  },
};

// Add hover effects with CSS-in-JS
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .profile-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(33, 150, 243, 0.4) !important;
      border-color: rgba(33, 150, 243, 0.8) !important;
    }
    
    .add-profile-card:hover {
      transform: translateY(-3px);
      border-color: rgba(33, 150, 243, 0.9) !important;
      background-color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .edit-button:hover {
      background-color: #1976D2 !important;
      transform: translateY(-1px);
    }
    
    .delete-button:hover {
      background-color: #D32F2F !important;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Profiles;