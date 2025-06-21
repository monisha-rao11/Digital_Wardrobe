import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from '../components/ui/button.tsx';
import { Card } from "../components/ui/card.tsx";
import { Check, Download, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";

const SummaryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData;

  // Redirect to form if no data is available
  if (!formData) {
    navigate('/form');
    return null;
  }

  const downloadCSV = () => {
    // Convert form data to CSV format
    const headers = Object.keys(formData).join(",");
    const values = Object.values(formData).join(",");
    const csv = `${headers}\n${values}`;
    
    // Create download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formData.name.replace(/\s+/g, "_")}_profile.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data downloaded successfully");
  };

  const handleEdit = () => {
    // Navigate back to form with existing data
    navigate('/form', { state: { formData } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <Card className="p-8 glass-card border-none">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-display font-medium">Profile Completed</h2>
              <p className="text-muted-foreground mt-2">Thank you for submitting your information</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Details</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                    {formData.photo && (
                      <div className="flex-shrink-0">
                        <img 
                          src={formData.photo} 
                          alt="User" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-muted"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span>{formData.name}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">Age:</span> <span>{formData.age}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">Gender:</span> <span className="capitalize">{formData.gender}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">Occupation:</span> <span>{formData.occupation}</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">Height:</span> <span>{formData.height} cm</span></li>
                        <li className="flex justify-between"><span className="text-muted-foreground">Weight:</span> <span>{formData.weight} kg</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Body Measurements</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-muted-foreground">Shoulders:</span> <span>{formData.shoulders} cm</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">{formData.gender === "female" ? "Bust" : "Chest"}:</span> <span>{formData.bust} cm</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Waist:</span> <span>{formData.waist} cm</span></li>
                    <li className="flex justify-between"><span className="text-muted-foreground">Hips:</span> <span>{formData.hips} cm</span></li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Body Type</h3>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="font-medium text-primary">{formData.bodyType}</p>
                    <p className="text-sm text-muted-foreground mt-1">{formData.bodyTypeFeatures}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skin Tone</h3>
                  <div className="p-4 bg-primary/5 rounded-lg flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{
                        background: formData.skinTone === "Fair" ? '#F8D9C2' : 
                                  formData.skinTone === "Light" ? '#F3C6A5' : 
                                  formData.skinTone === "Medium" ? '#E0AC88' : 
                                  formData.skinTone === "Olive" ? '#C68E68' : 
                                  formData.skinTone === "Tan" ? '#9F7260' : '#6F4E42'
                      }}
                    />
                    <div>
                      <p className="font-medium">{formData.skinTone}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {getSkinToneDescription(formData.skinTone)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Preferences</h3>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {(formData.favoriteColors || []).map((color: string, index: number) => (
                      <div 
                        key={index} 
                        className="w-8 h-8 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="focus-ring">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button onClick={handleEdit} variant="outline" className="focus-ring">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button onClick={downloadCSV} className="focus-ring">
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <p>All data is processed and stored securely.</p>
          <p className="mt-1">© {new Date().getFullYear()} Smart Mirror. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

// Helper function to get skin tone description
function getSkinToneDescription(tone: string): string {
  switch (tone) {
    case "Fair":
      return "Very light, prone to sunburn, often found in people with Northern European ancestry";
    case "Light":
      return "Slightly darker than fair, may tan a little but still burns easily";
    case "Medium":
      return "Balanced skin tone, tans easily, common in Mediterranean, Middle Eastern, and South Asian regions";
    case "Olive":
      return "Warm greenish or golden undertone, common in Hispanic, Middle Eastern, and South Asian descent";
    case "Tan":
      return "Naturally darker than medium, tans very easily with sun exposure";
    case "Dark":
      return "Rich deep brown, high melanin levels, rarely burns, common in African, Indian, and Indigenous populations";
    default:
      return "";
  }
}

export default SummaryPage;
