// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { db, auth } from "../firebase.js";
// import { doc, getDoc } from "firebase/firestore";

// const UserProfile = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = auth.currentUser;
  
//   // State management
//   const [userName, setUserName] = useState(
//     location.state?.name || localStorage.getItem("currentUserName") || "User"
//   );
//   const [profileID, setProfileID] = useState(
//     location.state?.profileID || localStorage.getItem("currentProfileID") || null
//   );
//   const [profileData, setProfileData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }
    
//     // Store profile information
//     if (location.state?.profileID && location.state?.name) {
//       localStorage.setItem("currentProfileID", location.state.profileID);
//       localStorage.setItem("currentUserName", location.state.name);
//       setUserName(location.state.name);
//       setProfileID(location.state.profileID);
//     }

//     fetchProfileData();
//   }, [user, navigate, location.state, profileID]);

//   const fetchProfileData = async () => {
//     if (!profileID) {
//       setError("No profile ID available");
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       const profileRef = doc(db, "profileInfo", profileID);
//       const profileSnap = await getDoc(profileRef);
      
//       if (profileSnap.exists()) {
//         setProfileData(profileSnap.data());
//         setError(null);
//       } else {
//         setError("Profile not found");
//       }
//     } catch (err) {
//       setError("Error fetching profile data");
//       console.error("Error fetching profile:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = () => {
//     const formData = profileData ? {
//       profileID: profileData.profileID,
//       name: profileData.fullName,
//       age: profileData.age,
//       occupation: profileData.occupation,
//       gender: profileData.gender,
//       height: profileData.height,
//       weight: profileData.weight,
//       shoulders: profileData.shoulders,
//       bust: profileData.chest,
//       waist: profileData.waist,
//       hips: profileData.hips,
//       skinTone: profileData.skinTone,
//       favoriteColors: profileData.colorPreferences,
//       bodyType: profileData.bodyType,
//       bodyTypeFeatures: profileData.bodyTypeFeatures
//     } : null;

//     navigate("/form", { 
//       state: { 
//         formData: formData,
//         profileID: profileID,
//         isEdit: true
//       } 
//     });
//   };

//   const handleDashboard = () => {
//     navigate("/dashboard", {
//       state: { name: userName, profileID: profileID }
//     });
//   };

//   const downloadCSV = () => {
//     if (!profileData) return;
    
//     const headers = Object.keys(profileData).join(",");
//     const values = Object.values(profileData).map(value => 
//       Array.isArray(value) ? value.join(';') : value
//     ).join(",");
//     const csv = `${headers}\n${values}`;
    
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `${profileData.fullName?.replace(/\s+/g, "_") || 'profile'}_data.csv`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   if (loading) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.overlay}></div>
//         <div style={styles.contentWrapper}>
//           <div style={styles.loading}>
//             <div style={styles.spinner}></div>
//             <p>Loading profile...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.overlay}></div>
//         <div style={styles.contentWrapper}>
//           <div style={styles.error}>
//             <h3>Error</h3>
//             <p>{error}</p>
//             <div style={styles.buttonGroup}>
//               <button style={styles.button} onClick={fetchProfileData}>
//                 Retry
//               </button>
//               <button style={styles.buttonSecondary} onClick={handleDashboard}>
//                 Back to Dashboard
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!profileData) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.overlay}></div>
//         <div style={styles.contentWrapper}>
//           <div style={styles.error}>
//             <h3>No Profile Data</h3>
//             <p>No profile information found.</p>
//             <button style={styles.button} onClick={() => navigate("/form")}>
//               Create Profile
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.overlay}></div>
//       <div style={styles.contentWrapper}>
//         <div style={styles.card}>
//           {/* Header with Name and Profile ID */}
//           <div style={styles.header}>
//             <h2 style={styles.title}>{userName}</h2>
//             <p style={styles.profileId}>Profile ID: {profileID}</p>
//           </div>

//           {/* Profile Content */}
//           <div style={styles.content}>
//             {/* Personal Information */}
//             <div style={styles.section}>
//               <h3 style={styles.sectionTitle}>Personal Information</h3>
//               <div style={styles.grid}>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Full Name:</span>
//                   <span style={styles.value}>{profileData.fullName}</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Age:</span>
//                   <span style={styles.value}>{profileData.age}</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Gender:</span>
//                   <span style={styles.value}>{profileData.gender}</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Occupation:</span>
//                   <span style={styles.value}>{profileData.occupation || 'Not specified'}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Physical Attributes */}
//             <div style={styles.section}>
//               <h3 style={styles.sectionTitle}>Physical Attributes</h3>
//               <div style={styles.grid}>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Height:</span>
//                   <span style={styles.value}>{profileData.height} cm</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Weight:</span>
//                   <span style={styles.value}>{profileData.weight} kg</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Shoulders:</span>
//                   <span style={styles.value}>{profileData.shoulders} cm</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>{profileData.gender === "female" ? "Bust" : "Chest"}:</span>
//                   <span style={styles.value}>{profileData.chest} cm</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Waist:</span>
//                   <span style={styles.value}>{profileData.waist} cm</span>
//                 </div>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Hips:</span>
//                   <span style={styles.value}>{profileData.hips} cm</span>
//                 </div>
//               </div>
//             </div>

//             {/* Body Type */}
//             {profileData.bodyType && (
//               <div style={styles.section}>
//                 <h3 style={styles.sectionTitle}>Body Type</h3>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Type:</span>
//                   <span style={styles.value}>{profileData.bodyType}</span>
//                 </div>
//                 {profileData.bodyTypeFeatures && (
//                   <div style={styles.field}>
//                     <span style={styles.label}>Features:</span>
//                     <span style={styles.value}>{profileData.bodyTypeFeatures}</span>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Skin Tone */}
//             {profileData.skinTone && (
//               <div style={styles.section}>
//                 <h3 style={styles.sectionTitle}>Skin Tone</h3>
//                 <div style={styles.field}>
//                   <span style={styles.label}>Tone:</span>
//                   <span style={styles.value}>{profileData.skinTone}</span>
//                 </div>
//               </div>
//             )}

//             {/* Color Preferences */}
//             {profileData.colorPreferences && profileData.colorPreferences.length > 0 && (
//               <div style={styles.section}>
//                 <h3 style={styles.sectionTitle}>Color Preferences</h3>
//                 <div style={styles.colorGrid}>
//                   {profileData.colorPreferences.map((color, index) => (
//                     <div 
//                       key={index} 
//                       style={{
//                         ...styles.colorSwatch,
//                         backgroundColor: color
//                       }}
//                       title={color}
//                     />
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Profile Metadata */}
//             <div style={styles.section}>
//               <h3 style={styles.sectionTitle}>Profile Metadata</h3>
//               <div style={styles.grid}>
//                 {profileData.createdAt && (
//                   <div style={styles.field}>
//                     <span style={styles.label}>Created:</span>
//                     <span style={styles.value}>
//                       {new Date(profileData.createdAt).toLocaleDateString()}
//                     </span>
//                   </div>
//                 )}
//                 {profileData.lastUpdated && (
//                   <div style={styles.field}>
//                     <span style={styles.label}>Last Updated:</span>
//                     <span style={styles.value}>
//                       {new Date(profileData.lastUpdated).toLocaleDateString()}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div style={styles.actions}>
//             <button style={styles.button} onClick={handleEdit}>
//               Edit Profile
//             </button>
//             <button style={styles.buttonSecondary} onClick={downloadCSV}>
//               Download Data
//             </button>
//             <button style={styles.button} onClick={handleDashboard}>
//               Dashboard
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)",
//     position: "relative",
//     display: "flex",
//     flexDirection: "column",
//     fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
//   },
  
//   overlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//     zIndex: 1,
//   },
  
//   contentWrapper: {
//     position: "relative",
//     zIndex: 2,
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     padding: "20px",
//   },
  
//   card: {
//     maxWidth: "800px",
//     width: "100%",
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     borderRadius: "15px",
//     boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)",
//     border: "1px solid rgba(33, 150, 243, 0.3)",
//     overflow: "hidden"
//   },
  
//   header: {
//     backgroundColor: "rgba(33, 150, 243, 0.9)",
//     color: "white",
//     padding: "24px",
//     textAlign: "center"
//   },
  
//   title: {
//     margin: "0 0 8px 0",
//     fontSize: "24px",
//     fontWeight: "600",
//     textShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)"
//   },
  
//   profileId: {
//     margin: "0",
//     fontSize: "14px",
//     opacity: "0.9"
//   },
  
//   content: {
//     padding: "24px"
//   },
  
//   section: {
//     marginBottom: "32px"
//   },
  
//   sectionTitle: {
//     margin: "0 0 16px 0",
//     fontSize: "18px",
//     fontWeight: "600",
//     color: "#1976d2",
//     borderBottom: "2px solid rgba(33, 150, 243, 0.3)",
//     paddingBottom: "8px"
//   },
  
//   grid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//     gap: "16px"
//   },
  
//   field: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "12px 0",
//     borderBottom: "1px solid rgba(33, 150, 243, 0.2)"
//   },
  
//   label: {
//     fontWeight: "500",
//     color: "#1976d2"
//   },
  
//   value: {
//     color: "#424242",
//     textAlign: "right"
//   },
  
//   colorGrid: {
//     display: "flex",
//     flexWrap: "wrap",
//     gap: "8px"
//   },
  
//   colorSwatch: {
//     width: "32px",
//     height: "32px",
//     borderRadius: "4px",
//     border: "1px solid rgba(33, 150, 243, 0.3)"
//   },
  
//   actions: {
//     padding: "24px",
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     borderTop: "1px solid rgba(33, 150, 243, 0.2)",
//     display: "flex",
//     gap: "12px",
//     justifyContent: "center",
//     flexWrap: "wrap"
//   },
  
//   button: {
//     backgroundColor: "#2196f3",
//     color: "white",
//     border: "none",
//     padding: "12px 24px",
//     borderRadius: "8px",
//     fontSize: "14px",
//     fontWeight: "500",
//     cursor: "pointer",
//     transition: "background-color 0.2s, transform 0.1s",
//     fontWeight: "bold"
//   },
  
//   buttonSecondary: {
//     backgroundColor: "#FFFFFF",
//     color: "#2196f3",
//     border: "2px solid #2196f3",
//     padding: "12px 24px",
//     borderRadius: "8px",
//     fontSize: "14px",
//     fontWeight: "bold",
//     cursor: "pointer",
//     transition: "background-color 0.2s"
//   },
  
//   buttonGroup: {
//     display: "flex",
//     gap: "12px",
//     marginTop: "16px"
//   },
  
//   loading: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     minHeight: "50vh",
//     color: "#1976d2",
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     borderRadius: "15px",
//     padding: "40px",
//     boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)"
//   },
  
//   spinner: {
//     width: "32px",
//     height: "32px",
//     border: "3px solid rgba(33, 150, 243, 0.3)",
//     borderTop: "3px solid #2196f3",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite"
//   },
  
//   error: {
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     padding: "32px",
//     borderRadius: "15px",
//     textAlign: "center",
//     maxWidth: "400px",
//     margin: "0 auto",
//     boxShadow: "0 8px 20px rgba(33, 150, 243, 0.2)",
//     border: "1px solid rgba(33, 150, 243, 0.3)",
//     color: "#1976d2"
//   }
// };

// export default UserProfile;



import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Edit3, Download, ArrowRight } from "lucide-react";
import { db, auth } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const [userName, setUserName] = useState("User");
  const [profileID, setProfileID] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Get profile info from navigation state or localStorage
    let currentProfileID = "";
    let currentUserName = "";

    if (location.state?.profileID && location.state?.name) {
      currentProfileID = location.state.profileID;
      currentUserName = location.state.name;
      localStorage.setItem("currentProfileID", currentProfileID);
      localStorage.setItem("currentUserName", currentUserName);
    } else {
      currentProfileID = localStorage.getItem("currentProfileID") || "";
      currentUserName = localStorage.getItem("currentUserName") || "User";
    }

    setProfileID(currentProfileID);
    setUserName(currentUserName);

    if (currentProfileID) {
      fetchProfileData(currentProfileID);
    } else {
      setError("No profile ID available");
      setLoading(false);
    }
  }, [user, navigate, location.state]);

  const fetchProfileData = async (profileId) => {
    if (!profileId) {
      setError("No profile ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileRef = doc(db, "profileInfo", profileId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfileData(data);
        
        // Update name if available in profile data
        if (data.fullName) {
          setUserName(data.fullName);
          localStorage.setItem("currentUserName", data.fullName);
        }
      } else {
        setError("Profile not found");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.message.includes("not found")) {
        setError("Profile not found");
      } else if (err.message.includes("permission")) {
        setError("You don't have permission to access this profile");
      } else {
        setError("Error fetching profile data. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!profileData) return;

    const formData = {
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
    };

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
      Array.isArray(value) ? `"${value.join(';')}"` : `"${value}"`
    ).join(",");
    const csv = `${headers}\n${values}`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profileData.fullName?.replace(/\s+/g, "_") || 'profile'}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSkinToneColor = (skinTone) => {
    const toneMap = {
      'Very Light': '#FFEFD5',
      'Light': '#F5DEB3',
      'Medium': '#D2B48C',
      'Dark': '#8B4513',
      'Very Dark': '#654321'
    };
    return toneMap[skinTone] || '#D2B48C';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => fetchProfileData(profileID)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleDashboard}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Profile Data</h3>
          <p className="text-gray-600 mb-4">No profile information found.</p>
          <button 
            onClick={() => navigate("/form")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{userName}</h1>
          <p className="text-gray-600 text-sm">Profile ID: {profileID}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{profileData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{profileData.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{profileData.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupation:</span>
                    <span className="font-medium">{profileData.occupation || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-medium">{profileData.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{profileData.weight} kg</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Body Measurements</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shoulders:</span>
                    <span className="font-medium">{profileData.shoulders} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{profileData.gender === "Female" ? "Bust" : "Chest"}:</span>
                    <span className="font-medium">{profileData.chest} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waist:</span>
                    <span className="font-medium">{profileData.waist} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hips:</span>
                    <span className="font-medium">{profileData.hips} cm</span>
                  </div>
                </div>
              </div>
            </div>

            {(profileData.bodyType || profileData.skinTone) && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {profileData.bodyType && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Body Type</h2>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-1">{profileData.bodyType}</h3>
                      {profileData.bodyTypeFeatures && (
                        <p className="text-sm text-gray-700">{profileData.bodyTypeFeatures}</p>
                      )}
                    </div>
                  </div>
                )}

                {profileData.skinTone && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Skin Tone</h2>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: getSkinToneColor(profileData.skinTone) }}
                        ></div>
                        <h3 className="font-semibold">{profileData.skinTone}</h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {profileData.colorPreferences && profileData.colorPreferences.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Color Preferences</h2>
                <div className="flex flex-wrap gap-2">
                  {profileData.colorPreferences.map((color, index) => (
                    <div 
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button 
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              
              <button 
                onClick={handleDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;