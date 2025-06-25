// // src/components/Login.js
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase.js";

// const Login = () => {
//   const [email, setEmail]     = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError]     = useState("");
//   const [showPopup, setShowPopup] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     setTimeout(() => setShowPopup(false), 3000);
//   }, []);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       // Just sign in—no Firestore lookup!
//       await signInWithEmailAndPassword(auth, email, password);
//       alert("Login Successful!");
//       navigate("/profiles");
//     } catch (err) {
//       console.error("Login Error:", err);
//       setError("Invalid email or password");
//     }
//   };
//   const styles = {
//     container: {
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       height: "100vh",
//       backgroundColor: "#f4f4f4",
//     },
//     popup: {
//       position: "absolute",
//       top: "20px",
//       backgroundColor: "#000",
//       color: "#fff",
//       padding: "10px 20px",
//       borderRadius: "5px",
//       boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
//     },
//     form: {
//       backgroundColor: "white",
//       padding: "20px",
//       borderRadius: "8px",
//       boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
//       width: "300px",
//       textAlign: "center",
//     },
//     input: {
//       width: "100%",
//       padding: "10px",
//       margin: "10px 0",
//       borderRadius: "5px",
//       border: "1px solid #ccc",
//     },
//     button: {
//       width: "100%",
//       padding: "10px",
//       backgroundColor: "#000",
//       color: "white",
//       border: "none",
//       borderRadius: "5px",
//       cursor: "pointer",
//     },
//     goBack: {
//       marginTop: "10px",
//       color: "#000",
//       textDecoration: "none",
//       fontSize: "14px",
//     },
//     error: {
//       color: "red",
//       fontSize: "14px",
//     },
//   };


//   return (
//     <div style={styles.container}>
//       {showPopup && <div style={styles.popup}>Welcome Back!</div>}
//       <form onSubmit={handleLogin} style={styles.form}>
//         <h2>Login</h2>
//         {error && <p style={styles.error}>{error}</p>}
//         <input
//           type="email"
//           placeholder="Email"
//           style={styles.input}
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           style={styles.input}
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <button type="submit" style={styles.button}>
//           Login
//         </button>
//         <Link to="/smartmirror" style={styles.goBack}>
//           ← Go Back to Smart Mirror
//         </Link>
//       </form>
//     </div>
//   );
// };

// export default Login;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Logo component
  const Logo = () => (
    <div className="flex flex-col items-center mb-6">
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-1 border-2 border-blue-400">
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
          <img 
            src="/logo.png" 
            alt="Digital Wardrobe Logo" 
            className="w-20 h-20 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23fff'/%3E%3Cpath d='M30,30 L70,30 L70,70 L30,70 Z' stroke='%232196f3' fill='none' stroke-width='2'/%3E%3Cline x1='35' y1='40' x2='65' y2='40' stroke='%232196f3' stroke-width='2'/%3E%3Crect x='40' y1='45' width='5' height='20' fill='%23f5f5dc'/%3E%3Crect x='55' y1='45' width='5' height='20' fill='%23cd7f32'/%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-blue-600 mt-4">DIGITAL WARDROBE</h1>
      <div className="flex items-center gap-3 text-sm text-blue-600 mt-1">
        <span className="h-px bg-blue-400 w-12"></span>
        <span className="uppercase tracking-widest">Personalize your Wardrobe</span>
        <span className="h-px bg-blue-400 w-12"></span>
      </div>
    </div>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate to profiles page after successful login
      navigate("/profiles");
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : "Failed to login. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
         style={{ background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)" }}>
      
      <div className="w-full max-w-md bg-white/90 border border-blue-200 rounded-xl shadow-xl overflow-hidden z-10"
           style={{ boxShadow: "0 4px 20px rgba(33, 150, 243, 0.3)" }}>
        <div className="px-8 pt-8 pb-6 flex flex-col items-center">
          <Logo />
        </div>
        
        <div className="p-8 border-t border-blue-200">
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-lg mb-6 flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-blue-300 bg-white rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-blue-300 bg-white rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                style={{ 
                  fontSize: "18px",
                  minWidth: "120px",
                  backgroundColor: "#2196f3",
                  fontWeight: "bold"
                }}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-600">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link 
                to="/signup" 
                className="w-full flex justify-center py-3 px-4 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;