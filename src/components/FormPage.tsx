
import React from "react";
import FormContainer from "./userprofile/components/FormContainer.tsx";

const FormPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-block mb-3">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Smart Mirror
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-4">
            Discover Your <span className="text-primary">Personal Style</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Complete this profile to help us understand your physical characteristics, style preferences, and color choices. 
            We'll use this information to provide personalized recommendations.
          </p>
        </div>
        
        <FormContainer />
        
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <p>All data is processed locally and not sent to any server.</p>
          <p className="mt-1">© {new Date().getFullYear()} Smart Mirror. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default FormPage;
