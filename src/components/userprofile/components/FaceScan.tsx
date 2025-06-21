import React, { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button.tsx";
import { Card } from "./ui/card.tsx";
import { Camera, CameraOff, RotateCcw, Check, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import  saveAs from "file-saver";


// Interface for component props
interface FaceScanProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const FaceScan: React.FC<FaceScanProps> = ({ formData, setFormData }) => {
  // State variables for camera functionality
  const [isCameraActive, setIsCameraActive] = useState(false); // Tracks if camera is currently active
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Stores the captured image as base64 string
  const [stream, setStream] = useState<MediaStream | null>(null); // Stores the media stream from camera
  const [cameraError, setCameraError] = useState<string | null>(null); // Tracks camera error messages

  // State variables for 30-second timer functionality
  const [isLongTimerActive, setIsLongTimerActive] = useState(false);
  const [longTimerCount, setLongTimerCount] = useState(30);
  const [timedCapturedImages, setTimedCapturedImages] = useState<string[]>([]);
  const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Add state variables for guidance
  const [currentPose, setCurrentPose] = useState<string>("Look directly at camera");
  const [lightingQuality, setLightingQuality] = useState<'poor' | 'fair' | 'good'>('fair');
  const [showLightingTip, setShowLightingTip] = useState(false);
  const poseInstructions = [
    "Look directly at camera",
    "Turn face slightly left",
    "Turn face slightly right",
    "Tilt chin up slightly",
    "Tilt chin down slightly",
    "Normal expression",
    "Smiling expression",
    "Turn face left profile",
    "Turn face right profile",
    "Look directly at camera again"
  ];

  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null); // Reference to video element for camera preview
  const canvasRef = useRef<HTMLCanvasElement>(null); // Reference to canvas element for image capture

  // Function to start the camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    
    try {
      console.log("Starting camera...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,  // Simplify constraints for testing
        audio: false
      });
      
      console.log("Camera access granted, tracks:", mediaStream.getVideoTracks().length);
      
      // Store the stream
      setStream(mediaStream);
      setIsCameraActive(true);
      
      // Explicitly set the video source
      if (videoRef.current) {
        console.log("Setting video source");
        videoRef.current.srcObject = mediaStream;
        
        // Add event listeners for debugging
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        
        videoRef.current.onplay = () => console.log("Video playing");
        videoRef.current.onpause = () => console.log("Video paused");
        videoRef.current.onerror = (e) => console.error("Video error:", e);
      } else {
        console.error("Video ref is null");
      }
      
      toast.success("Camera activated successfully");
    } catch (error) {
      console.error("Error accessing camera:", error);
      
      // Set appropriate error message
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError("Camera permission denied");
          toast.error("Camera access denied. Please allow camera access in your browser settings.");
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError("No camera found");
          toast.error("No camera found. Please connect a camera and try again.");
        } else {
          setCameraError(`Camera error: ${error.name}`);
          toast.error(`Camera error: ${error.name}`);
        }
      } else {
        setCameraError("Unable to access camera");
        toast.error("Unable to access camera. Please check permissions.");
      }
    }
  }, []);

  // Function to stop the camera
  const stopCamera = useCallback(() => {
    if (stream) {
      // Stop all tracks in the media stream
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    
    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Function to capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas (no mirroring for captured image)
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        console.log("Captured image data length:", imageData.length);
        
        // Store captured image in component state
        setCapturedImage(imageData);
        
        // Save to form data for persistence
        setFormData((prev: any) => ({
          ...prev,
          facePhoto: imageData
        }));
        
        // Stop camera after capture
        stopCamera();
        toast.success("Photo captured successfully!");
      }
    }
  }, [setFormData, stopCamera]);

  // Function to retake photo
  const retakePhoto = useCallback(() => {
    // Clear captured image from state and form data
    setCapturedImage(null);
    setFormData((prev: any) => ({
      ...prev,
      facePhoto: null
    }));
    // Restart camera for new photo
    startCamera();
  }, [setFormData, startCamera]);

  // Function to confirm the captured photo
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      toast.success("Face photo confirmed and saved");
    }
  }, [capturedImage]);

  // Function to analyze lighting from video
  const analyzeLighting = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!context) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Convert RGB to brightness (0-255)
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      
      // Determine lighting quality based on brightness
      if (avgBrightness < 70) {
        setLightingQuality('poor');
        setShowLightingTip(true);
      } else if (avgBrightness < 120) {
        setLightingQuality('fair');
        setShowLightingTip(Math.random() > 0.7); // Show tip occasionally
      } else {
        setLightingQuality('good');
        setShowLightingTip(false);
      }
    } catch (error) {
      console.error("Error analyzing lighting:", error);
    }
  }, []);

  // Function to start the 30-second timer and capture multiple photos
  const startLongTimerCapture = useCallback(() => {
    if (!isCameraActive) return;
    
    setIsLongTimerActive(true);
    setLongTimerCount(30);
    setTimedCapturedImages([]);
    
    // Initial instruction
    setCurrentPose(poseInstructions[0]);
    toast.info("Starting capture. Follow the on-screen instructions.");
    
    // Start countdown
    const interval = setInterval(() => {
      setLongTimerCount(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setIsLongTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
    
    // Capture an image every 3 seconds with changing pose instructions
    const captureInt = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          setTimedCapturedImages(prev => {
            const newImages = [...prev, imageData];
            
            // Change pose instruction after each capture
            const nextPoseIndex = Math.min(newImages.length, poseInstructions.length - 1);
            setCurrentPose(poseInstructions[nextPoseIndex]);
            
            // Check lighting
            analyzeLighting();
            
            return newImages;
          });
        }
      }
    }, 3000); // Capture every 3 seconds
    
    setCaptureInterval(captureInt);
    
    // Stop after 30 seconds
    setTimeout(() => {
      if (captureInterval) clearInterval(captureInterval);
      if (timerInterval) clearInterval(timerInterval);
      setIsLongTimerActive(false);
      toast.success(`Captured ${Math.floor(30/3)} photos with different poses!`);
    }, 30000);
  }, [isCameraActive, poseInstructions, analyzeLighting]);

  // Function to cancel the long timer
  const cancelLongTimer = useCallback(() => {
    if (captureInterval) clearInterval(captureInterval);
    if (timerInterval) clearInterval(timerInterval);
    setIsLongTimerActive(false);
    toast.info("Timer cancelled");
  }, [captureInterval, timerInterval]);



// Updated function signature to accept profileId
const saveImagesAsZip = useCallback(
  async (profileId: string) => {
    if (timedCapturedImages.length === 0) {
      toast.error("No images to save");
      return;
    }

    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("face-captures");

      // Add each image to the zip
      timedCapturedImages.forEach((imgData, index) => {
        const imageData = imgData.split(",")[1];
        const byteCharacters = atob(imageData);
        const byteArray = new Uint8Array(
          [...byteCharacters].map((char) => char.charCodeAt(0))
        );
        const blob = new Blob([byteArray], { type: "image/jpeg" });

        const timestamp = new Date().toISOString().replace(/:/g, "-");
        imgFolder?.file(`face-capture-${index + 1}-${timestamp}.jpg`, blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Save the zip file locally (unchanged)
      saveAs(zipBlob, "face-captures.zip");

      // Upload to backend
      const zipFile = new File([zipBlob], "face-captures.zip", {
        type: "application/zip",
      });
      const formData = new FormData();
      formData.append("file", zipFile);
      formData.append("profile_id", profileId);

      const res = await fetch("http://localhost:5000/api/upload-face", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Images uploaded and saved as zip");
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error saving/uploading images:", error);
      toast.error("Failed to save/upload images");
    }
  },
  [timedCapturedImages]
);


  // Cleanup effect - stop camera when component unmounts
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Effect to pre-fill captured image if editing existing data
  React.useEffect(() => {
    if (formData.facePhoto && !capturedImage) {
      console.log("Loading existing face photo from form data");
      setCapturedImage(formData.facePhoto);
    }
  }, [formData.facePhoto, capturedImage]);

  // Debug effect to log current state
  React.useEffect(() => {
    console.log("FaceScan state:", {
      isCameraActive,
      hasCapturedImage: !!capturedImage,
      capturedImageLength: capturedImage?.length || 0,
      formDataFacePhoto: !!formData.facePhoto
    });
  }, [isCameraActive, capturedImage, formData.facePhoto]);

  // Add this effect to ensure video plays when stream is available
  React.useEffect(() => {
    if (stream && videoRef.current) {
      console.log("Effect: Setting video source");
      
      // Try direct property setting
      videoRef.current.srcObject = stream;
      
      // Force a layout recalculation
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Attempting to play video after timeout");
          videoRef.current.play()
            .then(() => console.log("Video playback started in effect"))
            .catch(err => console.error("Error playing video in effect:", err));
        }
      }, 100);
    }
  }, [stream]);

  // Add this effect to monitor if video is actually receiving data
  React.useEffect(() => {
    if (isCameraActive && videoRef.current) {
      const checkVideoData = setInterval(() => {
        const video = videoRef.current;
        if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          console.log("Video is receiving data:", {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
          clearInterval(checkVideoData);
        }
      }, 500);
      
      return () => clearInterval(checkVideoData);
    }
  }, [isCameraActive]);

  // Add this effect to check lighting periodically
  React.useEffect(() => {
    if (isCameraActive) {
      const lightingCheck = setInterval(analyzeLighting, 1000);
      return () => clearInterval(lightingCheck);
    }
  }, [isCameraActive, analyzeLighting]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header section */}
      <div className="space-y-1">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            Face Analysis
          </span>
        </div>
        <h3 className="text-2xl font-display font-medium tracking-tight">Capture Your Face</h3>
        <p className="text-muted-foreground text-sm">
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Camera/Image display area */}
        <Card className="relative overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300">
          {/* Default state - no camera, no image */}
          {!isCameraActive && !capturedImage && (
            <div className="w-80 h-60 flex flex-col items-center justify-center text-gray-500">
              <Camera className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">Ready to capture</p>
              <p className="text-sm">
                {cameraError 
                  ? `Error: ${cameraError}. Please check camera permissions.` 
                  : "Click the button below to start your camera"}
              </p>
            </div>
          )}

          {/* Camera active state - show live video feed with instructions */}
          {isCameraActive && (
            <div className="relative rounded-lg overflow-hidden" style={{ width: '480px', height: '360px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' 
                }}
              />
              
              {/* Lighting quality indicator */}
              <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-medium"
                   style={{
                     backgroundColor: 
                       lightingQuality === 'good' ? 'rgba(34, 197, 94, 0.8)' : 
                       lightingQuality === 'fair' ? 'rgba(234, 179, 8, 0.8)' : 
                       'rgba(239, 68, 68, 0.8)',
                     color: 'white'
                   }}>
                {lightingQuality === 'good' ? '✓ Good lighting' : 
                 lightingQuality === 'fair' ? '⚠️ Improve lighting' : 
                 '✗ Poor lighting'}
              </div>
              
              {/* Lighting tip */}
              {showLightingTip && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded text-center">
                  Tip: Move to a brighter area or face a light source
                </div>
              )}
              
              {/* 30-second timer overlay with pose instructions */}
              {isLongTimerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  <span className="text-5xl font-bold text-white mb-2">{longTimerCount}</span>
                  
                  {/* Next pose instruction */}
                  <div className="bg-primary/90 text-white px-3 py-2 rounded-md mb-2 text-center max-w-[90%]">
                    <span className="text-sm font-medium">{currentPose}</span>
                  </div>
                  
                  <span className="text-xs text-white mb-1">Next pose in {longTimerCount % 3 || 3}s</span>
                  <span className="text-xs text-white">Images: {timedCapturedImages.length}</span>
                  
                  {/* Lighting reminder */}
                  {(lightingQuality !== 'good') && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full animate-pulse">
                        ✨ Please move to better lighting ✨
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Captured image state - show the taken photo */}
          {capturedImage && (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-80 h-60 object-cover rounded-lg"
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Image failed to load:", e)}
              />
              {/* Success checkmark overlay */}
              <div className="absolute top-2 right-2">
                <Check className="h-6 w-6 text-green-500 bg-white rounded-full p-1" />
              </div>
            </div>
          )}
        </Card>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action buttons */}
        <div className="flex gap-4">
          {/* Initial state - start camera button */}
          {!isCameraActive && !capturedImage && (
            <Button onClick={startCamera} className="focus-ring">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}

          {/* Camera active state - buttons */}
          {isCameraActive && !capturedImage && (
            <div className="flex flex-wrap gap-2 mt-4">
              {/* Only show these buttons when the timer is NOT active */}
              {!isLongTimerActive && (
                <>
                  <Button 
                    onClick={startLongTimerCapture} 
                    className="focus-ring"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Start 30s Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="focus-ring">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                </>
              )}
              
              {/* Only show cancel button when timer IS active */}
              {isLongTimerActive && (
                <Button onClick={cancelLongTimer} variant="destructive" className="focus-ring">
                  Cancel Capture
                </Button>
              )}
            </div>
          )}

          {/* Image captured state - retake and confirm buttons */}
          {capturedImage && (
            <>
              <Button onClick={retakePhoto} variant="outline" className="focus-ring">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={confirmPhoto} className="focus-ring">
                <Check className="mr-2 h-4 w-4" />
                Confirm Photo
              </Button>
            </>
          )}
        </div>

        {/* Success message when photo is captured */}
        {capturedImage && (
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">
              ✓ Face photo captured successfully
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This will help us provide better experince 
            </p>
          </div>
        )}

        {/* Show download button when images are captured */}
        {timedCapturedImages.length > 0 && !isLongTimerActive && (
          <div className="mt-4">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-2">
                Captured {timedCapturedImages.length} images over 30 seconds
              </p>
              <Button onClick={() => saveImagesAsZip(formData.id)} className="focus-ring">
                <Download className="mr-2 h-4 w-4" />
                Download All Images
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Images will be saved as a zip file
              </p>
            </div>
            
            {/* Preview of captured images */}
            <div className="mt-4 overflow-x-auto">
              <div className="flex gap-2 p-2" style={{ maxWidth: '100%' }}>
                {timedCapturedImages.slice(0, 5).map((img, index) => (
                  <img 
                    key={index}
                    src={img} 
                    alt={`Capture ${index + 1}`} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ))}
                {timedCapturedImages.length > 5 && (
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-sm text-gray-500">+{timedCapturedImages.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceScan;


























