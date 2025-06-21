
import React from "react";
import { Button } from '../components/ui/button.tsx';
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <main className="flex-grow flex items-center justify-center">
        <div className="container px-4 py-16 md:py-24 text-center animate-fade-up">
          <div className="inline-block mb-3">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Smart Mirror
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium tracking-tight mb-6">
            Welcome to <span className="text-primary">Smart Mirror</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10">
            Let's start by knowing your style. Discover your unique body type and skin tone with our advanced profiling system.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/form">
              <Button size="lg" className="group">
                Start Profiling
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      
      <footer className="bg-white py-6 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Smart Mirror. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const Feature = ({ title, description }: { title: string; description: string }) => (
  <div className="p-6 glass-card rounded-xl text-left">
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default Index;
