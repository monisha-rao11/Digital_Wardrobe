import React from "react";
import { Link } from "react-router-dom";

const SmartMirror = () => {
  const styles = {
    container: {
      backgroundImage: 'url("/sm1.png")', // Ensure the image is inside the public/ folder
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start", // Align to the left
      justifyContent: "flex-start", // Align to the top
      padding: "20px",
      color: "white",
      textAlign: "left",
    },
    header: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px", // Space between title and buttons
    },
    buttonsContainer: {
      display: "flex",
      flexDirection: "column",
    },
    button: {
      margin: "10px 0",
      padding: "10px 30px",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      backgroundColor: "rgba(0, 0, 0, 0.6)", // Slightly transparent black
      color: "white",
      borderRadius: "5px",
      textDecoration: "none",
    },
    buttonHover: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Welcome to Smart Mirror Family </h1>
      <div style={styles.buttonsContainer}>
        <Link to="/login" style={styles.button}>
          <button style={styles.button}>Login</button>
        </Link>
        <Link to="/signup" style={styles.button}>
          <button style={styles.button}>Sign Up</button>
        </Link>
      </div>
    </div>
  );
};

export default SmartMirror;
