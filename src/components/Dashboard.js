import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  // State to store user information
  const [userName, setUserName] = useState("");
  const [profileID, setProfileID] = useState(null);

  // Effect to retrieve profile data
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      console.error("No user is logged in.");
      navigate("/login");
      return;
    }

    // First try to get data from location state (from direct navigation)
    if (location.state?.profileID && location.state?.name) {
      setUserName(location.state.name);
      setProfileID(location.state.profileID);

      // Store in localStorage for persistence
      localStorage.setItem("currentProfileID", location.state.profileID);
      localStorage.setItem("currentUserName", location.state.name);
    }
    // If not available in location state, try localStorage
    else {
      const storedProfileID = localStorage.getItem("currentProfileID");
      const storedUserName = localStorage.getItem("currentUserName");

      if (storedProfileID && storedUserName) {
        setProfileID(storedProfileID);
        setUserName(storedUserName);
      }
      // If not in localStorage either, redirect to profiles page
      else {
        console.log("No profile information found in localStorage");
        navigate("/profiles");
      }
    }
  }, [user, navigate, location.state]);

  // Ensure profile info is passed to all navigation events
  const navigateWithProfileInfo = (path) => {
    navigate(path, {
      state: {
        name: userName,
        profileID: profileID
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements[0].value;
    if (searchValue.trim()) {
      navigateWithProfileInfo(`/search?query=${searchValue}`);
    }
  };

  const IconBox = ({ icon, label, path }) => (
    <div style={styles.iconBox} onClick={() => navigateWithProfileInfo(path)}>
      <span style={styles.icon}>{icon}</span>
      <p>{label}</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeText}>Welcome, {userName}!</h1>
          <p style={styles.subText}>Hope you have a great day with Smart Mirror!</p>
          <p style={styles.profileIDText}>
            Profile ID: {profileID || "Not available"}
          </p>
        </div>

        <form onSubmit={handleSearch} style={styles.searchContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search for products, brands and more"
            style={styles.searchInput}
          />
        </form>

        <div style={styles.iconsContainer}>
          <IconBox
            icon="❤️"
            label="Favorites"
            path="/wishlist"
          />
          <IconBox
            icon="👤"
            label="Profile"
            path="/profile"
          />
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Main content area */}
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Your Dashboard</h2>
          <p style={styles.emptyText}>
            Your personalized recommendations and recent outfits will appear here.
          </p>
        </div>
      </div>

      <div style={styles.bottomNav}>
        <div style={styles.navItem}>
          <span style={styles.navIcon}>🏠</span>
          <p>Home</p>
        </div>
        <div
          style={styles.navItem}
          onClick={() => navigateWithProfileInfo("/catalog")}
        >
          <span style={styles.navIcon}>📁</span>
          <p>My Wardrobe</p>
        </div>
        <div style={styles.navSpacer}></div> {/* Spacer for the floating + button */}
        <div
          style={styles.navItem}
          onClick={() => {
            localStorage.removeItem("currentProfileID");
            localStorage.removeItem("currentUserName");
            navigate("/profiles");
          }}
        >
          <span style={styles.navIcon}>🔄</span>
          <p>Switch</p>
        </div>
      </div>

      <div
        style={styles.addButtonContainer}
        onClick={() => navigateWithProfileInfo("/uploadform")}
      >
        <div style={styles.addButton}>+</div>
        <p style={styles.addButtonText}>Upload Item</p>
      </div>
    </div>
  );
};

// Updated styling with white to blue gradient theme
const styles = {
  container: {
    textAlign: "center",
    background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)", // White to blue gradient
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  header: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottom: "1px solid rgba(33, 150, 243, 0.3)", // Blue border
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    margin: "0",
    padding: "20px",
    boxSizing: "border-box",
    boxShadow: "0 2px 10px rgba(33, 150, 243, 0.2)",
  },

  welcomeSection: {
    textAlign: "left",
    color: "#1976d2", // Blue
  },

  welcomeText: {
    color: "#1976d2", // Blue
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 0 5px 0",
  },

  subText: {
    fontSize: "14px",
    color: "#424242", // Dark gray
    margin: "0 0 5px 0",
  },

  profileIDText: {
    color: "#424242", // Dark gray
    fontSize: "12px",
    margin: "0",
  },

  searchContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(33, 150, 243, 0.3)", // Blue border
    borderRadius: "25px",
    padding: "10px 20px",
    width: "40%",
    boxShadow: "0 2px 8px rgba(33, 150, 243, 0.1)",
  },

  searchIcon: {
    fontSize: "18px",
    marginRight: "10px",
    color: "#1976d2", // Blue
  },

  searchInput: {
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    flex: 1,
    fontSize: "14px",
    color: "#424242", // Dark gray
  },

  iconsContainer: {
    display: "flex",
    gap: "20px",
  },

  iconBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    color: "#1976d2", // Blue
  },

  icon: {
    fontSize: "24px",
  },

  mainContent: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: "120px", // Add padding to account for floating button
  },

  emptyState: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 4px 20px rgba(33, 150, 243, 0.3)",
  },

  emptyTitle: {
    color: "#1976d2", // Blue
    fontSize: "24px",
    marginBottom: "15px",
    fontWeight: "bold",
  },

  emptyText: {
    color: "#424242", // Dark gray
    fontSize: "16px",
    lineHeight: "1.6",
  },

  bottomNav: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTop: "1px solid rgba(33, 150, 243, 0.3)", // Blue border
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    padding: "15px 0",
    boxShadow: "0 -2px 10px rgba(33, 150, 243, 0.2)",
    position: "relative",
  },

  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    flex: 1,
    color: "#1976d2", // Blue
    fontSize: "12px",
  },

  navSpacer: {
    flex: 1, // Takes up space for the floating button
  },

  navIcon: {
    fontSize: "24px",
    marginBottom: "4px",
  },

  addButtonContainer: {
    position: "absolute",
    bottom: "25px", // Positioned above the bottom nav
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    zIndex: 10,
  },

  addButton: {
    width: "60px",
    height: "60px",
    backgroundColor: "#2196f3", // Blue button
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
    fontWeight: "bold",
    boxShadow: "0px 4px 8px rgba(33, 150, 243, 0.5)", // Blue shadow
    transition: "background-color 0.3s, transform 0.2s",
    marginBottom: "5px",
  },

  addButtonText: {
    color: "#1976d2",
    fontSize: "12px",
    fontWeight: "600",
    margin: "0",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "4px 8px",
    borderRadius: "12px",
    boxShadow: "0px 2px 4px rgba(33, 150, 243, 0.3)",
    whiteSpace: "nowrap",
  },
};

export default Dashboard;