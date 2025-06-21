import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";

// Sample avatars
const avatars = [
  "/av1.png",
  "/av2.png",
  "/av3.png",
  "/av4.png",
  "/av5.png",
  "/av6.png",
  "/av7.png",
  "/av8.png",
];

const ProfileCreation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  // Check if editing an existing profile
  const editingProfile = location.state?.profile || null;

  const [name, setName] = useState(editingProfile?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(editingProfile?.avatar || avatars[0]);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [error, setError] = useState("");

  // Handle PIN input - only allow 4 digits
  const handlePinChange = (value, setPinFunction) => {
    // Only allow numeric input and limit to 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    setPinFunction(numericValue);
  };

  useEffect(() => {
    if (!user) {
      console.error("No user is logged in.");
      navigate("/login");
    }
  }, [user, navigate]);

  // Handle Profile Creation or Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!name || !selectedAvatar) {
      setError("All fields are required.");
      return;
    }

    if (editingProfile) {
      // Editing Profile: Only update PIN if entered
      if (newPin || confirmNewPin) {
        if (!oldPin) {
          setError("Enter your current PIN to update it.");
          return;
        }
        if (newPin !== confirmNewPin) {
          setError("New PINs do not match.");
          return;
        }
        if (newPin.length !== 4) {
          setError("PIN must be exactly 4 digits.");
          return;
        }

        try {
          const profileDoc = await getDoc(doc(db, "profiles", editingProfile.id));
          if (profileDoc.exists() && profileDoc.data().pin !== oldPin) {
            setError("Current PIN is incorrect.");
            return;
          }

          await updateDoc(doc(db, "profiles", editingProfile.id), {
            name,
            avatar: selectedAvatar,
            pin: newPin, // Updating the PIN
          });

          alert("Profile and PIN updated successfully!");
          
          // Store profile ID in localStorage for persistence
          localStorage.setItem("currentProfileID", editingProfile.id);
          localStorage.setItem("currentUserName", name);
          
          // FIX: Navigate to dashboard instead of userprofile for consistency
          navigate("/dashboard", {
            state: {
              name: name,
              profileID: editingProfile.id,
            },
          });
          
        } catch (error) {
          console.error("Error updating profile:", error);
          setError("Failed to update profile.");
        }
      } else {
        // If no new PIN is provided, only update name and avatar
        try {
          await updateDoc(doc(db, "profiles", editingProfile.id), {
            name,
            avatar: selectedAvatar,
          });

          alert("Profile updated successfully!");
          
          // Store profile ID in localStorage for persistence
          localStorage.setItem("currentProfileID", editingProfile.id);
          localStorage.setItem("currentUserName", name);
          
          // FIX: Navigate to dashboard instead of userprofile for consistency
          navigate("/dashboard", {
            state: {
              name: name,
              profileID: editingProfile.id,
            },
          });
          
        } catch (error) {
          console.error("Error updating profile:", error);
          setError("Failed to update profile.");
        }
      }
    } else {
      // Creating a New Profile
      if (!newPin || !confirmNewPin) {
        setError("Please enter and confirm your PIN.");
        return;
      }
      if (newPin !== confirmNewPin) {
        setError("PINs do not match.");
        return;
      }
      if (newPin.length !== 4) {
        setError("PIN must be exactly 4 digits.");
        return;
      }

      try {
        const docRef = await addDoc(collection(db, "profiles"), {
          uid: user.uid,
          email: user.email,
          name,
          avatar: selectedAvatar,
          pin: newPin,
          createdAt: new Date().toISOString(),
        });
        
        alert("Profile created successfully!");
        
        // Store profile ID in localStorage for persistence
        localStorage.setItem("currentProfileID", docRef.id);
        localStorage.setItem("currentUserName", name);
        
        navigate("/user-profile", {
          state: {
            name: name,
            profileID: docRef.id,
          },
        });
        
      } catch (error) {
        console.error("Error creating profile:", error);
        setError("Failed to create profile.");
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Dark overlay */}
      <div style={styles.overlay}></div>
      
      {/* Header section */}
      <div style={styles.header}></div>
      
      {/* Main content */}
      <div style={styles.contentWrapper}>
        <h1 style={styles.pageTitle}>
          {editingProfile ? "Edit Your Profile" : "Create Your Profile"}
        </h1>

        {/* Error Message */}
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleProfileSubmit} style={styles.form}>
          {/* Enter Name */}
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />

          {/* Avatar Selection */}
          <div style={styles.avatarContainer}>
            <h3 style={styles.avatarTitle}>Choose Your Avatar</h3>
            <div style={styles.avatarGrid}>
              {avatars.map((avatar, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.avatarWrapper,
                    border: selectedAvatar === avatar ? "3px solid #FBBF24" : "3px solid transparent",
                    boxShadow: selectedAvatar === avatar ? "0 0 15px rgba(251, 191, 36, 0.7)" : "none",
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    onClick={() => setSelectedAvatar(avatar)}
                    style={styles.avatar}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PIN Setup (For New Profiles) */}
          {!editingProfile && (
            <div style={styles.pinSection}>
              <h3 style={styles.pinTitle}>Create Your PIN</h3>
              <input
                type="password"
                placeholder="Enter 4 digit PIN"
                value={newPin}
                onChange={(e) => handlePinChange(e.target.value, setNewPin)}
                style={styles.input}
                maxLength={4}
              />
              <input
                type="password"
                placeholder="Confirm 4 digit PIN"
                value={confirmNewPin}
                onChange={(e) => handlePinChange(e.target.value, setConfirmNewPin)}
                style={styles.input}
                maxLength={4}
              />
            </div>
          )}

          {/* Edit PIN (Only for Existing Profiles) */}
          {editingProfile && (
            <div style={styles.pinSection}>
              <h3 style={styles.pinTitle}>Update Your PIN (Optional)</h3>
              <input
                type="password"
                placeholder="Enter Current 4 digit PIN"
                value={oldPin}
                onChange={(e) => handlePinChange(e.target.value, setOldPin)}
                style={styles.input}
                maxLength={4}
              />
              <input
                type="password"
                placeholder="Enter New 4 digit PIN (Optional)"
                value={newPin}
                onChange={(e) => handlePinChange(e.target.value, setNewPin)}
                style={styles.input}
                maxLength={4}
              />
              <input
                type="password"
                placeholder="Confirm New 4 digit PIN"
                value={confirmNewPin}
                onChange={(e) => handlePinChange(e.target.value, setConfirmNewPin)}
                style={styles.input}
                maxLength={4}
              />
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" style={styles.button}>
            {editingProfile ? "Update Profile" : "Create Profile"}
          </button>
          
          {/* Back Button */}
          <button 
            type="button" 
            onClick={() => navigate("/profiles")} 
            style={styles.backButton}
          >
            Back to Profiles
          </button>
        </form>
      </div>
      
      {/* Bottom navigation */}
      <div style={styles.bottomNav}></div>
    </div>
  );
};

// Styling
const styles = {
  container: { 
    textAlign: "center",
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)", // White to blue gradient
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Light white overlay for depth
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
  
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    width: "100%",
    maxWidth: "450px",
    backgroundColor: "rgba(255, 255, 255, 0.9)", // White form background
    border: "1px solid rgba(33, 150, 243, 0.3)", // Blue border
    borderRadius: "15px",
    padding: "25px",
    boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)", // Blue shadow
  },
  
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid rgba(33, 150, 243, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.9)", // White input background
    color: "#424242",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  
  button: {
    width: "100%",
    backgroundColor: "#2196f3", // Blue button
    color: "#FFFFFF",
    fontWeight: "bold",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
    transition: "background-color 0.2s, transform 0.1s",
  },
  
  backButton: {
    width: "100%",
    backgroundColor: "#FFFFFF", // White background
    color: "#2196f3", // Blue text
    fontWeight: "bold",
    border: "2px solid #2196f3", // Blue border
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.2s",
  },
  
  avatarContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "15px",
  },
  
  avatarTitle: {
    color: "#1976d2", // Blue title
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  
  avatarGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  
  avatarWrapper: {
    width: "85px",
    height: "85px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
    border: "3px solid rgba(33, 150, 243, 0.3)", // Blue border
    backgroundColor: "rgba(255, 255, 255, 0.9)", // White background
  },
  
  avatar: { 
    width: "75px", 
    height: "75px", 
    borderRadius: "50%",
    objectFit: "cover",
  },
  
  pinSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  
  pinTitle: {
    color: "#1976d2", // Blue title
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  
  error: {
    color: "#F87171",
    fontSize: "16px",
    fontWeight: "bold",
    backgroundColor: "rgba(255, 235, 238, 0.9)",
    padding: "10px 15px",
    borderRadius: "8px",
    marginBottom: "10px",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
  },
  
  pageTitle: {
    color: "#1976d2", // Blue title
    fontSize: "32px",
    fontWeight: "bold",
    margin: "30px 0 25px 0",
    textShadow: "0px 2px 4px rgba(33, 150, 243, 0.3)",
  },
  
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // White header
    borderBottom: "1px solid rgba(33, 150, 243, 0.2)", // Blue border
    padding: "15px 20px",
    position: "relative",
    zIndex: 2,
    width: "100%",
  },
  
  bottomNav: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // White footer
    borderTop: "1px solid rgba(33, 150, 243, 0.2)", // Blue border
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    padding: "15px 0",
    position: "relative",
    zIndex: 2,
  },
};

export default ProfileCreation;