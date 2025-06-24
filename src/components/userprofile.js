
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  
  // Try to get profile information from location state first, then from localStorage
  const [userName, setUserName] = useState(location.state?.name || localStorage.getItem("currentUserName") || "User");
  const [profileID, setProfileID] = useState(location.state?.profileID || localStorage.getItem("currentProfileID") || null);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      console.error("No user is logged in.");
      navigate("/login");
      return;
    }
    
    // Store profile information in localStorage for persistence
    if (location.state?.profileID && location.state?.name) {
      localStorage.setItem("currentProfileID", location.state.profileID);
      localStorage.setItem("currentUserName", location.state.name);
      setUserName(location.state.name);
      setProfileID(location.state.profileID);
    }
  }, [user, navigate, location.state]);

  const handleSubmit = () => {
    navigate("/dashboard", {
      state: {
        name: userName,
        profileID: profileID
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.welcomeText}>Welcome, {userName}!</h1>
        <p style={styles.profileIDText}>Profile ID: {profileID || "Not available"}</p>
        
        <button 
          style={styles.submitButton} 
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)", // White to blue gradient
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  content: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.3)",
  },
  
  welcomeText: {
    color: "#1976d2", // Blue
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  
  profileIDText: {
    color: "#424242", // Dark gray
    fontSize: "16px",
    marginBottom: "30px",
  },
  
  submitButton: {
    padding: "15px 30px",
    backgroundColor: "#2196f3", // Blue button
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
    minWidth: "120px",
  },
};

export default UserProfile;