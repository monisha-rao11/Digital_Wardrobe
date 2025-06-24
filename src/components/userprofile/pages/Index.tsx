import React from "react";
import { Button } from '../components/ui/button.tsx';
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-white-100 overflow-hidden">
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-6xl text-center">
          <div className="inline-block mb-6">
            <span className="text-sm font-medium bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              Smart Mirror
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-500">Smart Mirror</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10">
            Let's start by knowing your style. Discover your unique body type and skin tone with our advanced profiling system.
          </p>
          
          <div className="flex items-center justify-center mb-16">
            <Link to="/form">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors">
                Start Profiling
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Feature 
                title="Body Type Analysis" 
                description="Our algorithm analyzes your measurements to determine your exact body type category."
              />
              <Feature 
                title="Skin Tone Profiling" 
                description="Identify your skin tone on our spectrum ranging from fair to dark with detailed descriptions."
              />
              <Feature 
                title="Color Recommendations" 
                description="Get personalized color palette suggestions that complement your skin tone and style preferences."
              />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-4 flex-shrink-0 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 Smart Mirror. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const Feature = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm text-left">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default Index;