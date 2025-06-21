// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { db } from "../firebase.js";
// import { doc, getDoc } from "firebase/firestore";

// const EnterPin = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const profile = location.state?.profile;
//   const [pin, setPin] = useState("");
//   const [error, setError] = useState("");

//   if (!profile) {
//     return <h1 style={{ textAlign: "center", marginTop: "50px" }}>Profile Not Found</h1>;
//   }

//   const handlePinSubmit = async () => {
//     try {
//       const profileRef = doc(db, "profiles", profile.id);
//       const profileSnap = await getDoc(profileRef);

//       if (profileSnap.exists()) {
//         const storedPin = profileSnap.data().pin;

//         if (pin === storedPin) {
//           navigate("/dashboard", { state: { name: profile.name } });
//         } else {
//           setError("Incorrect PIN. Try again.");
//         }
//       } else {
//         setError("Profile not found.");
//       }
//     } catch (error) {
//       console.error("Error verifying PIN:", error);
//       setError("Error verifying PIN. Please try again.");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.modal}>
//         <h2>Enter PIN for {profile.name}</h2>
//         <input
//           type="password"
//           maxLength="4"
//           value={pin}
//           onChange={(e) => setPin(e.target.value)}
//           style={styles.input}
//           placeholder="Enter PIN"
//         />
//         {error && <p style={styles.error}>{error}</p>}
//         <button onClick={handlePinSubmit} style={styles.button}>Submit</button>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     height: "100vh",
//     backgroundColor: "#f8f9fa"
//   },
//   modal: {
//     backgroundColor: "white",
//     padding: "20px",
//     borderRadius: "10px",
//     boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
//     textAlign: "center",
//     width: "300px"
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     marginTop: "10px",
//     fontSize: "18px",
//     textAlign: "center",
//     border: "1px solid #ccc",
//     borderRadius: "5px"
//   },
//   button: {
//     marginTop: "10px",
//     backgroundColor: "#007bff",
//     color: "white",
//     padding: "10px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     width: "100%"
//   },
//   error: {
//     color: "red",
//     fontSize: "14px",
//     marginTop: "5px"
//   }
// };
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase.js";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

const EnterPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Get profile from location state
    if (location.state?.profile) {
      setProfile(location.state.profile);
    } else {
      // Attempt to get from localStorage if not in state
      const profileId = localStorage.getItem("selectedProfileID");
      const profileName = localStorage.getItem("selectedProfileName");
      
      if (profileId && profileName) {
        setProfile({
          id: profileId,
          name: profileName
        });
      } else {
        // No profile info available, redirect back to profiles page
        navigate("/profiles");
      }
    }
  }, [location.state, navigate]);

  const handlePinChange = (e) => {
    setPin(e.target.value);
    setError("");
  };

  const handleSuccessfulPinEntry = async () => {
    const pendingAction = localStorage.getItem("pendingAction");
    const selectedProfileID = localStorage.getItem("selectedProfileID");
    const selectedProfileData = localStorage.getItem("selectedProfileData");

    if (pendingAction === "edit") {
      // Clear the pending action
      localStorage.removeItem("pendingAction");
      localStorage.removeItem("selectedProfileData");
      
      // Navigate to create-profile with the profile data for editing
      const profileData = JSON.parse(selectedProfileData);
      navigate("/create-profile", { state: { profile: profileData } });
      
    } else if (pendingAction === "delete") {
      // Show confirmation dialog after successful PIN entry
      const confirmDelete = window.confirm(`Are you sure you want to permanently delete the profile "${profile.name}"? This action cannot be undone.`);
      
      if (!confirmDelete) {
        // User cancelled, navigate back to profiles
        localStorage.removeItem("pendingAction");
        localStorage.removeItem("selectedProfileData");
        navigate("/profiles");
        return;
      }

      // Clear the pending action
      localStorage.removeItem("pendingAction");
      localStorage.removeItem("selectedProfileData");
      
      try {
        // Perform the actual deletion
        await deleteDoc(doc(db, "profiles", selectedProfileID));
        
        // Navigate back to profiles page
        navigate("/profiles");
        
        // Optional: Show success message
        alert("Profile deleted successfully.");
        
      } catch (error) {
        console.error("Error deleting profile:", error);
        alert("Failed to delete the profile.");
        // Still navigate back to profiles page
        navigate("/profiles");
      }
      
    } else {
      // Regular profile selection (no pending action)
      // Store profile info in localStorage for persistence
      localStorage.setItem("currentProfileID", profile.id);
      localStorage.setItem("currentUserName", profile.name);
      
      // Navigate to dashboard
      navigate("/dashboard", {
        state: {
          profileID: profile.id,
          name: profile.name,
        }
      });
    }
    
    // Clean up localStorage
    localStorage.removeItem("selectedProfileID");
    localStorage.removeItem("selectedProfileName");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile || !profile.id) {
      setError("Profile information is missing. Please go back and try again.");
      return;
    }

    try {
      // Fetch the profile document to verify PIN
      const profileRef = doc(db, "profiles", profile.id);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        setError("Profile not found");
        return;
      }
      
      const profileData = profileDoc.data();
      
      // Check if PIN matches
      if (profileData.pin === pin) {
        // Handle successful PIN entry based on pending action
        await handleSuccessfulPinEntry();
      } else {
        setError("Incorrect PIN");
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      setError("Error verifying PIN. Please try again.");
    }
  };

  // Get the action type for display purposes
  const getActionText = () => {
    const pendingAction = localStorage.getItem("pendingAction");
    if (pendingAction === "edit") {
      return "editing";
    } else if (pendingAction === "delete") {
      return "deleting";
    }
    return "accessing";
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      
      <div style={styles.formContainer}>
        <h1 style={styles.title}>Enter PIN</h1>
        
        {profile && (
          <div style={styles.profileInfo}>
            <p style={styles.profileName}>
              PIN required for {getActionText()}: {profile.name}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter your PIN"
            style={styles.input}
            maxLength={4}
            autoFocus
          />
          
          {error && <p style={styles.error}>{error}</p>}
          
          <div style={styles.buttons}>
            <button type="submit" style={styles.submitButton}>
              Unlock
            </button>
            <button 
              type="button" 
              onClick={() => {
                // Clean up localStorage when going back
                localStorage.removeItem("pendingAction");
                localStorage.removeItem("selectedProfileData");
                navigate("/profiles");
              }}
              style={styles.backButton}
            >
              Back to Profiles
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)", // White to blue gradient
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
  formContainer: {
    width: "90%",
    maxWidth: "400px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    padding: "30px",
    boxShadow: "0 10px 25px rgba(33, 150, 243, 0.2)",
    zIndex: 2,
    border: "1px solid rgba(33, 150, 243, 0.3)",
  },
  title: {
    color: "#1976d2",
    fontSize: "28px",
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  profileInfo: {
    textAlign: "center",
    marginBottom: "20px",
  },
  profileName: {
    color: "#1976d2",
    fontSize: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  input: {
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid rgba(33, 150, 243, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#424242",
    fontSize: "18px",
    textAlign: "center",
    letterSpacing: "0.5em",
  },
  error: {
    color: "#F87171",
    textAlign: "center",
    fontSize: "14px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  submitButton: {
    padding: "12px",
    backgroundColor: "#2196f3",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  backButton: {
    padding: "12px",
    backgroundColor: "transparent",
    color: "#2196f3",
    border: "1px solid #2196f3",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default EnterPin;