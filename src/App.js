// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import SmartMirror from "./components/SmartMirror.js"; 
// import Login from "./components/Login.js";
// import SignUp from "./components/SignUp.js";
// import Profiles from "./components/Profiles.js";
// import ProfileCreation from "./components/ProfileCreation.js";
// import Dashboard from "./components/Dashboard.js";
// import UserProfile from "./components/userprofile.js";
// import UploadForm from "./components/UploadForm.tsx";
// import EnterPin from "./components/EnterPin.js";
// import Catalog from "./components/Catalog.tsx";
// import FormPage from './components/FormPage.tsx';

// // Import user profile components from the userprofile folder
// import IndexPage from './components/userprofile/pages/Index.tsx';
// import SummaryPage from './components/userprofile/pages/SummaryPage.tsx';

// // Add required providers for user profile components
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { TooltipProvider } from "./components/userprofile/components/ui/tooltip.tsx";
// import { Toaster } from "./components/userprofile/components/ui/toaster.tsx";
// import { Toaster as Sonner } from "./components/userprofile/components/ui/sonner.tsx";

// // Create QueryClient instance
// const queryClient = new QueryClient();

// // Placeholder component for routes that aren't implemented yet
// const ComingSoon = ({ feature }) => (
//   <div style={{ 
//     display: 'flex', 
//     flexDirection: 'column', 
//     alignItems: 'center', 
//     justifyContent: 'center',
//     height: '100vh',
//     textAlign: 'center',
//     padding: '20px'
//   }}>
//     <h1>{feature} Feature</h1>
//     <p>This feature is coming soon! We're working hard to bring it to you.</p>
//     <button 
//       onClick={() => window.history.back()} 
//       style={{
//         marginTop: '20px',
//         padding: '10px 20px',
//         backgroundColor: '#007bff',
//         color: 'white',
//         border: 'none',
//         borderRadius: '5px',
//         cursor: 'pointer'
//       }}
//     >
//       Go Back
//     </button>
//   </div>
// );

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <Router>
//           <Routes>
//             {/* Redirect "/" to "/smartmirror" */}
//             <Route path="/" element={<Navigate to="/smartmirror" replace />} />
            
//             {/* Landing page */}
//             <Route path="/smartmirror" element={<SmartMirror />} />

//             {/* Authentication Pages */}
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<SignUp />} />
//             <Route path="/profiles" element={<Profiles />} />
//             <Route path="/create-profile" element={<ProfileCreation />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/profile" element={<UserProfile />} />
//             <Route path="/uploadform" element={<UploadForm />} />
//             <Route path="/enter-pin" element={<EnterPin />} />
            
//             {/* User Profile Routes - These are the key ones */}
//             <Route path="/user-profile" element={<IndexPage />} />
//             <Route path="/user-profile/form" element={<FormPage />} />
//             <Route path="/user-profile/summary" element={<SummaryPage />} />
            
//             {/* Other Routes */}
//             <Route path="/catalog" element={<Catalog />} />
//             <Route path="/wishlist" element={<ComingSoon feature="Wishlist" />} />
//             <Route path="/search" element={<Catalog />} /> 
//             <Route path="/outfits" element={<ComingSoon feature="Outfits" />} />
//             <Route path="/recommendations" element={<ComingSoon feature="Recommendations" />} />
//           </Routes>
//         </Router>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SmartMirror from "./components/SmartMirror.js"; 
import Login from "./components/Login.js";
import SignUp from "./components/SignUp.js";
import Profiles from "./components/Profiles.js";
import ProfileCreation from "./components/ProfileCreation.js";
import Dashboard from "./components/Dashboard.js";
import UserProfile from "./components/userprofile.js";
import UploadForm from "./components/UploadForm.tsx";
import EnterPin from "./components/EnterPin.js";
import Catalog from "./components/Catalog.tsx"; // Import the Catalog component
import FormPage from './components/FormPage.tsx';
import SummaryPage from './components/userprofile/pages/SummaryPage.tsx';
import IndexPage from './components/userprofile/pages/Index.tsx';


// Placeholder component for routes that aren't implemented yet
const ComingSoon = ({ feature }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '20px'
  }}>
    <h1>{feature} Feature</h1>
    <p>This feature is coming soon! We're working hard to bring it to you.</p>
    <button 
      onClick={() => window.history.back()} 
      style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Go Back
    </button>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect "/" to "/smartmirror" */}
        <Route path="/" element={<Navigate to="/smartmirror" replace />} />
        
        {/* Landing page */}
        <Route path="/smartmirror" element={<SmartMirror />} />

        {/* Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/create-profile" element={<ProfileCreation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/uploadform" element={<UploadForm />} />
        <Route path="/enter-pin" element={<EnterPin />} />
        

        
        {/* New Routes */}
        <Route path="/Catalog" element={<Catalog />} />
        <Route path="/wishlist" element={<ComingSoon feature="Wishlist" />} />
        <Route path="/search" element={<Catalog />} /> 
        <Route path="/outfits" element={<ComingSoon feature="Outfits" />} />
        <Route path="/recommendations" element={<ComingSoon feature="Recommendations" />} />
        <Route path="/user-profile" element={<IndexPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </Router>
  );
}

export default App;