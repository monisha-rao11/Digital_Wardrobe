// import React, { useState, useEffect, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { getAuth } from 'firebase/auth';
// import { useSwipeable } from 'react-swipeable';
// import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
// import { io, Socket } from 'socket.io-client';
// import {
//   ImageUpload,
//   BasicDetails,
//   ColorSelection,
//   AdditionalInfo,
//   GenderSelection, // New import
//   ClothingItem
// } from './UploadFormSteps.tsx';

// // Socket initialization outside component
// let socket: Socket | null = null;

// // Define proper props interface
// interface UploadFormProps {
//   currentProfileId?: string;
// }

// /**
//  * UploadForm Component
//  * 
//  * This component handles the multi-step process of uploading a clothing item:
//  * 1. Image upload and processing
//  * 2. Gender selection
//  * 3. Basic details collection
//  * 4. Color selection
//  * 5. Additional info
//  */
// export default function UploadForm({ currentProfileId }: UploadFormProps) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Edit mode state
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [itemId, setItemId] = useState<string | null>(null);

//   // Image state
//   const [imageId, setImageId] = useState<string | null>(null);
//   const [originalImage, setOriginalImage] = useState<string | null>(null);
//   const [processedImage, setProcessedImage] = useState<string | null>(null);
//   const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
//   const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);

//   // Form state
//   const [step, setStep] = useState(0);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [currentColor, setCurrentColor] = useState('#000000');
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState<{
//     status: 'idle' | 'success' | 'error' | 'uploading';
//     message: string;
//   }>({ status: 'idle', message: '' });

//   // Form data for clothing item with gender added
//   const [formData, setFormData] = useState<Partial<ClothingItem>>({
//     gender: '',
//     colors: [],
//     brand: '',
//     size: '',
//     category: '',
//     subcategory: '',
//     washingCondition: '',
//     notes: '',
//     dateAdded: new Date().toISOString(),
//   });

//   // Connection state
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [profileInfo, setProfileInfo] = useState<any>(null);

//   // Extract profileId with proper priority
//   const [effectiveProfileId, setEffectiveProfileId] = useState<string | null>(null);

//   // Initialize effectiveProfileId on mount and handle edit mode
//   useEffect(() => {
//     const profileIdFromProps = currentProfileId;
//     const profileIdFromState = location.state?.profileID || location.state?.currentProfileId;
//     const newEffectiveProfileId = profileIdFromProps || profileIdFromState || null;

//     // Check if we're in edit mode
//     const editMode = location.state?.isEditing === true;
//     setIsEditMode(editMode);

//     if (editMode) {
//       // Set item ID if in edit mode
//       setItemId(location.state?.itemId || null);

//       // Populate form with existing data
//       if (location.state?.formData) {
//         setFormData({
//           ...location.state.formData,
//           // If the existing item doesn't have gender (from previous version), default to a reasonable value
//           gender: location.state.formData.gender || (location.state.formData.category === 'Dresses' ? 'female' : ''),
//         });
//       }

//       // Set image data
//       if (location.state?.imageId) {
//         setImageId(location.state.imageId);
//       }

//       if (location.state?.processedImage) {
//         setProcessedImage(location.state.processedImage);
//       }

//       if (location.state?.originalImage) {
//         setOriginalImage(location.state.originalImage);
//       }

//       // Set preview URLs
//       if (location.state?.processedPreviewUrl) {
//         setProcessedPreviewUrl(location.state.processedPreviewUrl);
//       }

//       if (location.state?.originalPreviewUrl) {
//         setOriginalPreviewUrl(location.state.originalPreviewUrl);
//       }

//       // If we have all needed data for the first step, validate it
//       if (location.state?.processedPreviewUrl) {
//         setValidationErrors(prev => ({ ...prev, 0: false }));
//       }
//     }

//     if (newEffectiveProfileId) {
//       console.log("Setting effective profile ID:", newEffectiveProfileId);
//       setEffectiveProfileId(newEffectiveProfileId);
//     } else {
//       console.error("No profile ID found from any source");
//       setUploadStatus({
//         status: 'error',
//         message: 'Missing profile ID. Please select a profile first.'
//       });
//     }
//   }, [currentProfileId, location.state]);

//   // Initialize socket connection
//   useEffect(() => {
//     const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

//     // Create socket only if it doesn't exist yet
//     if (!socket) {
//       socket = io(SOCKET_URL, {
//         reconnectionAttempts: 5,
//         reconnectionDelay: 1000,
//         transports: ['websocket', 'polling']
//       });
//     }

//     // Set up socket event listeners
//     const handleConnect = () => {
//       console.log('Connected to WebSocket server');
//       setSocketConnected(true);
//     };

//     const handleDisconnect = () => {
//       console.log('Disconnected from WebSocket server');
//       setSocketConnected(false);
//     };

//     const handleConnectError = (error: Error) => {
//       console.error('Socket connection error:', error);
//       setSocketConnected(false);
//       setUploadStatus({
//         status: 'error',
//         message: 'Failed to connect to server. Please try again later.',
//       });
//     };

//     const handleProcessSuccess = (data: { processed_image: string; image_id: string }) => {
//       console.log('Image processed successfully:', data.image_id);
//       setIsUploading(false);
//       setImageId(data.image_id);
//       setProcessedImage(data.processed_image);
//       setProcessedPreviewUrl(`data:image/png;base64,${data.processed_image}`);
//       validateStep(0); // Re-validate step after image is processed
//     };

//     const handleProcessError = (error: { error: string }) => {
//       console.error('Image processing error:', error);
//       setIsUploading(false);
//       setUploadStatus({
//         status: 'error',
//         message: error.error || 'Image processing failed',
//       });
//     };

//     const handleUploadSuccess = (data: any) => {
//       console.log('Item successfully stored on backend:', data);
//       setIsUploading(false);
//       setUploadStatus({
//         status: 'success',
//         message: isEditMode
//           ? 'Item successfully updated in your wardrobe!'
//           : 'Item successfully added to your wardrobe!',
//       });

//       // Navigate back to dashboard after successful upload
//       setTimeout(() => {
//         navigate('/dashboard', { state: { profileId: effectiveProfileId } });
//         resetForm();
//       }, 2000);
//     };

//     const handleUploadError = (error: { error: string }) => {
//       console.error('Backend storage error:', error);
//       setIsUploading(false);
//       setUploadStatus({
//         status: 'error',
//         message: error.error || 'Failed to save item. Please try again.',
//       });
//     };

//     // Add event listeners
//     socket.on('connect', handleConnect);
//     socket.on('disconnect', handleDisconnect);
//     socket.on('connect_error', handleConnectError);
//     socket.on('process_success', handleProcessSuccess);
//     socket.on('process_error', handleProcessError);
//     socket.on('upload_success', handleUploadSuccess);
//     socket.on('upload_error', handleUploadError);

//     // Set initial connection state
//     setSocketConnected(socket.connected);

//     // Cleanup on component unmount
//     return () => {
//       if (socket) {
//         socket.off('connect', handleConnect);
//         socket.off('disconnect', handleDisconnect);
//         socket.off('connect_error', handleConnectError);
//         socket.off('process_success', handleProcessSuccess);
//         socket.off('process_error', handleProcessError);
//         socket.off('upload_success', handleUploadSuccess);
//         socket.off('upload_error', handleUploadError);
//       }
//     };
//   }, [navigate, effectiveProfileId, isEditMode]);

//   /**
//    * Fetch profile info when effectiveProfileId changes
//    */
//   useEffect(() => {
//     const fetchProfileInfo = async () => {
//       if (!effectiveProfileId) return;

//       try {
//         const auth = getAuth();
//         const user = auth.currentUser;
//         if (!user) throw new Error("User not authenticated");

//         const profileDoc = doc(db, "profiles", effectiveProfileId);
//         const profileSnap = await getDoc(profileDoc);

//         if (!profileSnap.exists()) {
//           console.error(`Profile not found for ID: ${effectiveProfileId}`);
//           setUploadStatus({
//             status: 'error',
//             message: 'Profile not found. Please select a different profile.'
//           });
//           return;
//         }

//         const profileData = profileSnap.data();
//         setProfileInfo({
//           id: effectiveProfileId,
//           uid: user.uid,
//           name: profileData.name || 'Default Profile'
//         });

//         console.log("Successfully loaded profile:", effectiveProfileId, profileData.name);
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//         setUploadStatus({
//           status: 'error',
//           message: 'Error loading profile information. Please try again.'
//         });
//       }
//     };

//     if (effectiveProfileId) {
//       fetchProfileInfo();
//     }
//   }, [effectiveProfileId]);

//   // Track validation errors for each step (now including gender selection)
//   const [validationErrors, setValidationErrors] = useState({
//     0: true, // Image upload
//     1: true, // Gender selection (new)
//     2: true, // Basic details
//     3: true, // Colors
//     4: true, // Additional info
//   });

//   const handleEditModeSteps = useCallback(() => {
//     if (isEditMode && processedPreviewUrl && step === 0) {
//       console.log("Edit mode with image data - skipping image upload step");
//       // Auto-validate step 0 since we already have the image
//       setValidationErrors(prev => ({ ...prev, 0: false }));
//       // Automatically move to step 1
//       setStep(1);
//     }
//   }, [isEditMode, processedPreviewUrl, step]);

//   // Apply edit mode handling after component mount and edit data loaded
//   useEffect(() => {
//     if (isEditMode && processedPreviewUrl && step === 0) {
//       // Small delay to ensure state is properly updated
//       const timer = setTimeout(() => {
//         handleEditModeSteps();
//       }, 100);
//       return () => clearTimeout(timer);
//     }
//   }, [isEditMode, processedPreviewUrl, step, handleEditModeSteps]);

//   /**
//    * Validates if the current step has all required data
//    */
//   const validateStep = useCallback((stepIndex: number) => {
//     let isValid = false;

//     switch (stepIndex) {
//       case 0:
//         // In edit mode, if we have a processed image, the step is valid
//         if (isEditMode && processedImage !== null) {
//           isValid = true;
//         } else {
//           isValid = selectedFile !== null && processedImage !== null;
//         }
//         break;
//       case 1:
//         // Validate gender selection
//         isValid = Boolean(formData.gender);
//         break;
//       case 2:
//         isValid = Boolean(
//           formData.category &&
//           formData.subcategory &&
//           formData.size &&
//           formData.brand?.trim()
//         );
//         break;
//       case 3:
//         isValid = Array.isArray(formData.colors) && formData.colors.length > 0;
//         break;
//       case 4:
//         isValid = Boolean(formData.washingCondition);
//         break;
//       default:
//         break;
//     }

//     setValidationErrors(prev => ({ ...prev, [stepIndex]: !isValid }));
//     return isValid;
//   }, [selectedFile, processedImage, formData, isEditMode]);

//   // Validate steps when dependencies change
//   useEffect(() => {
//     validateStep(0);
//     validateStep(1);
//     validateStep(2);
//     validateStep(3);
//     validateStep(4);
//   }, [formData, selectedFile, processedImage, validateStep]);

//   /**
//    * Reset form state to initial values
//    */
//   const resetForm = useCallback(() => {
//     setImageId(null);
//     setOriginalImage(null);
//     setProcessedImage(null);
//     setSelectedFile(null);
//     setOriginalPreviewUrl(null);
//     setProcessedPreviewUrl(null);
//     setFormData({
//       gender: '',
//       colors: [],
//       brand: '',
//       size: '',
//       category: '',
//       subcategory: '',
//       washingCondition: '',
//       notes: '',
//       dateAdded: new Date().toISOString(),
//     });
//     setStep(0);
//     setUploadStatus({ status: 'idle', message: '' });
//   }, []);

//   // Function to navigate to next step
//   const goToNextStep = useCallback(() => {
//     if (step < steps.length - 1 && !validationErrors[step]) {
//       setStep(step + 1);
//     }
//   }, [step, validationErrors]);

//   // Function to navigate to previous step
//   const goToPrevStep = useCallback(() => {
//     if (step > 0) {
//       setStep(step - 1);
//     }
//   }, [step]);

//   // Updated steps with gender selection
//   const steps = [
//     { 
//       number: 0,
//       title: 'Upload Image', 
//       component: ImageUpload 
//     },
//     {
//       number: 1,
//       title: 'Select Gender',
//       component: GenderSelection
//     },
//     { 
//       number: 2,
//       title: 'Basic Details', 
//       component: BasicDetails 
//     },
//     { 
//       number: 3,
//       title: 'Colors', 
//       component: ColorSelection 
//     },
//     { 
//       number: 4,
//       title: 'Additional Info', 
//       component: AdditionalInfo 
//     },
//   ];

//   // Set up swipe handlers with validation
//   const handlers = useSwipeable({
//     onSwipedLeft: () => !validationErrors[step] && goToNextStep(),
//     onSwipedRight: () => goToPrevStep(),
//     preventDefaultTouchmoveEvent: true,
//     trackMouse: true,
//   });

//   /**
//    * Handles file selection and initiates image processing
//    */
//   const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setSelectedFile(file);
//     setIsUploading(true);
//     setUploadStatus({ status: 'idle', message: '' });

//     try {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const dataUrl = reader.result as string;
//         setOriginalPreviewUrl(dataUrl);

//         // Extract base64 data
//         const base64Data = dataUrl.split(',')[1];
//         setOriginalImage(base64Data);

//         // Check if socket is connected
//         if (!socket?.connected) {
//           throw new Error("Socket not connected. Please refresh and try again.");
//         }

//         // Emit the image to the backend for processing
//         socket.emit('process_image', {
//           image: base64Data,
//           filename: file.name
//         });
//       };
//       reader.readAsDataURL(file);
//     } catch (error) {
//       console.error("File processing error:", error);
//       setIsUploading(false);
//       setUploadStatus({
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Failed to process file. Please try again.',
//       });
//     }
//   }, []);

//   /**
//    * Handles changes to form inputs
//    */
//   const handleInputChange = useCallback((field: string, value: any) => {
//     setFormData(prevData => ({
//       ...prevData,
//       [field]: value,
//     }));
//   }, []);

//   /**
//    * Handles final form submission through backend
//    * Instead of directly uploading to Firebase from frontend
//    */
//   const handleSubmit = useCallback(async () => {
//     // Validate connection, profile ID, and data
//     if (!socketConnected || !socket?.connected) {
//       setUploadStatus({ status: 'error', message: 'Not connected to server. Please refresh.' });
//       return;
//     }

//     if (!effectiveProfileId) {
//       setUploadStatus({ status: 'error', message: 'No profile selected. Please select a profile first.' });
//       return;
//     }

//     // Fix: Modified logic for image validation in edit mode
//     if ((!imageId || !processedImage) && !isEditMode) {
//       setUploadStatus({ status: 'error', message: 'Missing required data. Please complete all steps.' });
//       return;
//     }

//     if (validationErrors[4]) {
//       setUploadStatus({ status: 'error', message: 'Please complete all required fields.' });
//       return;
//     }

//     setIsUploading(true);
//     setUploadStatus({ status: 'idle', message: '' });

//     try {
//       // Get authentication
//       const auth = getAuth();
//       const user = auth.currentUser;
//       if (!user) throw new Error('You must be logged in to upload items.');

//       // Determine whether we're creating or updating
//       const operationType = isEditMode ? 'update_item' : 'finalize_upload';
//       console.log(`About to emit ${operationType} with image_id:`, imageId);

//       // Add confirmation handlers for the upload events
//       socket.on('upload_started', (response) => {
//         console.log('Upload started:', response);
//         setUploadStatus({ status: 'uploading', message: 'Upload started on server...' });
//       });

//       socket.on('upload_success', (response) => {
//         console.log('Upload success:', response);
//         setIsUploading(false);
//         setUploadStatus({
//           status: 'success',
//           message: isEditMode ? 'Item updated successfully!' : 'Item uploaded successfully!'
//         });
//         // Additional success handling (like showing the item in a catalog, etc.)
//       });

//       socket.on('upload_error', (response) => {
//         console.error('Upload error:', response);
//         setIsUploading(false);
//         setUploadStatus({ status: 'error', message: `Upload failed: ${response.error}` });
//       });

//       // Prepare the payload
//       const payload = {
//         user_id: user.uid,
//         profile_id: effectiveProfileId,
//         image_id: imageId,
//         processed_image: processedImage,
//         filename: selectedFile?.name || 'item.jpg',
//         metadata: {
//           gender: formData.gender || '', // Add gender field
//           category: formData.category || '',
//           sub_category: formData.subcategory || '',
//           size: formData.size || '',
//           brand: formData.brand || '',
//           colors: formData.colors || [],
//           washing_conditions: formData.washingCondition || 'Machine wash cold',
//           notes: formData.notes || '',
//           date_added: formData.dateAdded || new Date().toISOString(),
//           profile_id: effectiveProfileId,
//           user_id: user.uid
//         }
//       };

//       // If editing, add the item ID
//       if (isEditMode && itemId) {
//         payload.item_id = itemId;
//       }

//       // Emit the appropriate event based on create/update
//       socket.emit(operationType, payload);

//       console.log(`Item data sent to backend for ${isEditMode ? 'update' : 'storage'}`);

//     } catch (err) {
//       console.error('Submission error:', err);
//       setIsUploading(false);
//       setUploadStatus({
//         status: 'error',
//         message: err instanceof Error ? err.message : 'Failed to upload. Please try again.',
//       });
//     }
//   }, [
//     socketConnected,
//     socket,
//     effectiveProfileId,
//     imageId,
//     processedImage,
//     validationErrors,
//     formData,
//     selectedFile,
//     isEditMode,
//     itemId
//   ]);

//   // Animation variants
//   const pageVariants = {
//     initial: { opacity: 0, x: 50 },
//     animate: { opacity: 1, x: 0 },
//     exit: { opacity: 0, x: -50 }
//   };

//   // Modify the component rendering to conditionally render based on edit mode
//   const renderCurrentStep = () => {
//     // If in edit mode and this is the image upload step, and we have an image already
//     if (isEditMode && step === 0 && processedPreviewUrl) {
//       return (
//         <div className="text-center py-8">
//           <div className="mb-4">
//             <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
//               <img
//                 src={processedPreviewUrl}
//                 alt="Existing Item"
//                 className="max-h-full object-contain"
//               />
//             </div>
//             <p className="text-purple-700 font-medium">Existing image loaded successfully</p>
//             <p className="text-purple-500 text-sm">You can continue to the next step</p>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={goToNextStep}
//             className="mt-4 bg-purple-600 text-white py-2 px-6 rounded-xl shadow-sm hover:bg-purple-700"
//           >
//             Continue to Details
//             <ArrowRight className="w-4 h-4 ml-1 inline" />
//           </motion.button>
//         </div>
//       );
//     }

//     return React.createElement(steps[step].component, {
//       formData,
//       handleInputChange,
//       validationErrors,
//       selectedFile,
//       setSelectedFile,
//       originalPreviewUrl,
//       processedPreviewUrl,
//       isUploading,
//       handleFileChange,
//       currentColor,
//       setCurrentColor,
//       socketConnected
//     });
//   };

//   return (
//     <div {...handlers} className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
//       <ConnectionStatus socketConnected={socketConnected} />

//       <div className="max-w-md mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold text-white mb-2">
//           {isEditMode ? 'Edit Wardrobe Item' : 'Add to Wardrobe'}
//         </h1>
//         <p className="text-purple-200 mb-4">
//           {isEditMode ? 'Update' : 'Upload a new'} clothing item to {profileInfo?.name || 'your'} wardrobe
//           {!effectiveProfileId && <span className="text-red-300"> (No profile selected)</span>}
//         </p>

//         <TopImagePreview processedPreviewUrl={processedPreviewUrl} step={step} />

//         <ProgressIndicator step={step} steps={steps} />

//         <div className="mb-8 bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-purple-300 border-opacity-20">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={step}
//               initial="initial"
//               animate="animate"
//               exit="exit"
//               variants={pageVariants}
//               transition={{ duration: 0.3 }}
//             >
//               {renderCurrentStep()}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         <NavigationButtons
//           step={step}
//           steps={steps}
//           validationErrors={validationErrors}
//           isUploading={isUploading}
//           goToPrevStep={goToPrevStep}
//           goToNextStep={goToNextStep}
//           handleSubmit={handleSubmit}
//           hasProfileId={!!effectiveProfileId}
//           isEditMode={isEditMode}
//         />
//       </div>

//       <StatusMessage uploadStatus={uploadStatus} />
//     </div>
//   );
// }

// /**
//  * Connection status indicator component
//  */
// function ConnectionStatus({ socketConnected }: { socketConnected: boolean }) {
//   return !socketConnected ? (
//     <motion.div
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center mb-4 mx-4 mt-4"
//     >
//       <AlertCircle className="w-4 h-4 mr-2" />
//       Server connection lost. Waiting to reconnect...
//     </motion.div>
//   ) : null;
// }

// /**
//  * Shows the processed image preview above the form
//  */
// function TopImagePreview({ processedPreviewUrl, step }: { processedPreviewUrl: string | null; step: number }) {
//   if (!processedPreviewUrl || step === 0) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="mb-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-sm border border-purple-300 border-opacity-20 p-3 overflow-hidden"
//     >
//       <p className="text-sm text-purple-200 mb-2 font-medium">Your item:</p>
//       <div className="w-full h-32 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
//         <img
//           src={processedPreviewUrl}
//           alt="Item Preview"
//           className="max-h-full object-contain"
//         />
//       </div>
//     </motion.div>
//   );
// }

// /**
//  * Step indicator component
//  */
// function ProgressIndicator({ step, steps }: { step: number; steps: { title: string; component: React.ComponentType<any> }[] }) {
//   return (
//     <div className="flex justify-between items-center w-full mb-6">
//       {steps.map((s, i) => (
//         <div key={i} className="flex flex-col items-center">
//           <motion.div
//             initial={{ scale: 0.8 }}
//             animate={{
//               scale: i === step ? 1.1 : 1,
//               backgroundColor: i < step ? '#9333ea' : i === step ? '#e9d5ff' : '#1e1b4b',
//               color: i < step ? '#ffffff' : i === step ? '#581c87' : '#c4b5fd',
//               borderColor: i === step ? '#d8b4fe' : 'transparent'
//             }}
//             transition={{ duration: 0.3 }}
//             className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2"
//           >
//             {i + 1}
//           </motion.div>
//           <motion.span
//             initial={{ opacity: 0.5 }}
//             animate={{
//               opacity: i === step ? 1 : 0.5,
//               fontWeight: i === step ? 600 : 400
//             }}
//             className="text-xs mt-1 text-purple-200 hidden sm:block"
//           >
//             {s.title}
//           </motion.span>
//         </div>
//       ))}
//     </div>
//   );
// }

// /**
//  * Navigation buttons component
//  */
// function NavigationButtons({
//   step,
//   steps,
//   validationErrors,
//   isUploading,
//   goToPrevStep,
//   goToNextStep,
//   handleSubmit,
//   hasProfileId,
//   isEditMode
// }: {
//   step: number;
//   steps: any[];
//   validationErrors: { [key: number]: boolean };
//   isUploading: boolean;
//   goToPrevStep: () => void;
//   goToNextStep: () => void;
//   handleSubmit: () => void;
//   hasProfileId: boolean;
//   isEditMode: boolean;
// }) {
//   const buttonVariants = {
//     disabled: { opacity: 0.5 },
//     enabled: { opacity: 1 }
//   };

//   const isSubmitDisabled = validationErrors[step] || isUploading || !hasProfileId;

//   return (
//     <div className="flex justify-between">
//       <motion.button
//         variants={buttonVariants}
//         initial="enabled"
//         animate={step === 0 ? "disabled" : "enabled"}
//         whileHover={step > 0 ? { scale: 1.05 } : {}}
//         whileTap={step > 0 ? { scale: 0.95 } : {}}
//         onClick={goToPrevStep}
//         disabled={step === 0}
//         className={`flex items-center justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium ${
//           step === 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-indigo-800 text-purple-200 hover:bg-indigo-700'
//         }`}
//       >
//         <ArrowLeft className="w-4 h-4 mr-1" />
//         Back
//       </motion.button>

//       {step < steps.length - 1 ? (
//         <motion.button
//           variants={buttonVariants}
//           initial="enabled"
//           animate={validationErrors[step] ? "disabled" : "enabled"}
//           whileHover={!validationErrors[step] ? { scale: 1.05 } : {}}
//           whileTap={!validationErrors[step] ? { scale: 0.95 } : {}}
//           onClick={goToNextStep}
//           disabled={validationErrors[step]}
//           className={`flex items-center justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium ${
//             validationErrors[step] ? 'bg-purple-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
//           }`}
//         >
//           Next
//           <ArrowRight className="w-4 h-4 ml-1" />
//         </motion.button>
//       ) : (
//         <motion.button
//           variants={buttonVariants}
//           initial="enabled"
//           animate={isSubmitDisabled ? "disabled" : "enabled"}
//           whileHover={!isSubmitDisabled ? { scale: 1.05 } : {}}
//           whileTap={!isSubmitDisabled ? { scale: 0.95 } : {}}
//           onClick={handleSubmit}
//           disabled={isSubmitDisabled}
//           className={`flex items-center justify-center py-2 px-6 border border-transparent rounded-xl shadow-sm text-sm font-medium ${
//             isSubmitDisabled ? 'bg-purple-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
//           }`}
//         >
//           {isUploading ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-2"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//               {isEditMode ? 'Updating...' : 'Uploading...'}
//             </>
//           ) : (
//             <>
//               {isEditMode ? 'Update Item' : 'Save to Wardrobe'}
//               <CheckCircle className="w-4 h-4 ml-1" />
//             </>
//           )}
//         </motion.button>
//       )}
//     </div>
//   );
// }

// /**
//  * Status message component
//  */
// function StatusMessage({ uploadStatus }: { uploadStatus: { status: 'idle' | 'success' | 'error' | 'uploading'; message: string } }) {
//   if (uploadStatus.status === 'idle') return null;

//   const getStatusStyles = () => {
//     switch (uploadStatus.status) {
//       case 'success':
//         return {
//           bgColor: 'bg-green-50',
//           borderColor: 'border-green-200',
//           iconColor: 'text-green-500',
//           titleColor: 'text-green-800',
//           messageColor: 'text-green-700',
//           icon: CheckCircle,
//           title: 'Success!'
//         };
//       case 'uploading':
//         return {
//           bgColor: 'bg-blue-50',
//           borderColor: 'border-blue-200',
//           iconColor: 'text-blue-500',
//           titleColor: 'text-blue-800',
//           messageColor: 'text-blue-700',
//           icon: 'spinner', // We'll handle this separately
//           title: 'Uploading...'
//         };
//       case 'error':
//       default:
//         return {
//           bgColor: 'bg-red-50',
//           borderColor: 'border-red-200',
//           iconColor: 'text-red-500',
//           titleColor: 'text-red-800',
//           messageColor: 'text-red-700',
//           icon: AlertCircle,
//           title: 'Error'
//         };
//     }
//   };

//   const styles = getStatusStyles();
//   const IconComponent = styles.icon;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className={`fixed bottom-6 left-0 right-0 mx-auto w-11/12 max-w-md p-4 rounded-xl shadow-lg ${styles.bgColor} ${styles.borderColor} border`}
//     >
//       <div className="flex items-start">
//         {uploadStatus.status === 'uploading' ? (
//           <svg
//             className={`animate-spin w-5 h-5 ${styles.iconColor} mr-3 mt-0.5`}
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             ></circle>
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//             ></path>
//           </svg>
//         ) : (
//           <IconComponent className={`w-5 h-5 ${styles.iconColor} mr-3 mt-0.5`} />
//         )}
//         <div>
//           <p className={`text-sm font-medium ${styles.titleColor}`}>
//             {styles.title}
//           </p>
//           <p className={`text-sm ${styles.messageColor}`}>
//             {uploadStatus.message}
//           </p>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useSwipeable } from 'react-swipeable';
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { io, Socket } from 'socket.io-client';
import {
  ImageUpload,
  BasicDetails,
  ColorSelection,
  AdditionalInfo,
  GenderSelection, // New import
  ClothingItem
} from './UploadFormSteps.tsx';

// Socket initialization outside component
let socket: Socket | null = null;

// Define proper props interface
interface UploadFormProps {
  currentProfileId?: string;
}

/**
 * UploadForm Component
 * 
 * This component handles the multi-step process of uploading a clothing item:
 * 1. Image upload and processing
 * 2. Gender selection
 * 3. Basic details collection
 * 4. Color selection
 * 5. Additional info
 */
export default function UploadForm({ currentProfileId }: UploadFormProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  // Image state
  const [imageId, setImageId] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);

  // Form state
  const [step, setStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'success' | 'error' | 'uploading';
    message: string;
  }>({ status: 'idle', message: '' });

  // Form data for clothing item with gender added
  const [formData, setFormData] = useState<Partial<ClothingItem>>({
    gender: '',
    colors: [],
    brand: '',
    size: '',
    category: '',
    subcategory: '',
    washingCondition: '',
    notes: '',
    dateAdded: new Date().toISOString(),
  });

  // Connection state
  const [socketConnected, setSocketConnected] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>(null);

  // Extract profileId with proper priority
  const [effectiveProfileId, setEffectiveProfileId] = useState<string | null>(null);

  // Initialize effectiveProfileId on mount and handle edit mode
  useEffect(() => {
    const profileIdFromProps = currentProfileId;
    const profileIdFromState = location.state?.profileID || location.state?.currentProfileId;
    const newEffectiveProfileId = profileIdFromProps || profileIdFromState || null;

    // Check if we're in edit mode
    const editMode = location.state?.isEditing === true;
    setIsEditMode(editMode);

    if (editMode) {
      // Set item ID if in edit mode
      setItemId(location.state?.itemId || null);

      // Populate form with existing data
      if (location.state?.formData) {
        setFormData({
          ...location.state.formData,
          // If the existing item doesn't have gender (from previous version), default to a reasonable value
          gender: location.state.formData.gender || (location.state.formData.category === 'Dresses' ? 'female' : ''),
        });
      }

      // Set image data
      if (location.state?.imageId) {
        setImageId(location.state.imageId);
      }

      if (location.state?.processedImage) {
        setProcessedImage(location.state.processedImage);
      }

      if (location.state?.originalImage) {
        setOriginalImage(location.state.originalImage);
      }

      // Set preview URLs
      if (location.state?.processedPreviewUrl) {
        setProcessedPreviewUrl(location.state.processedPreviewUrl);
      }

      if (location.state?.originalPreviewUrl) {
        setOriginalPreviewUrl(location.state.originalPreviewUrl);
      }

      // If we have all needed data for the first step, validate it
      if (location.state?.processedPreviewUrl) {
        setValidationErrors(prev => ({ ...prev, 0: false }));
      }
    }

    if (newEffectiveProfileId) {
      console.log("Setting effective profile ID:", newEffectiveProfileId);
      setEffectiveProfileId(newEffectiveProfileId);
    } else {
      console.error("No profile ID found from any source");
      setUploadStatus({
        status: 'error',
        message: 'Missing profile ID. Please select a profile first.'
      });
    }
  }, [currentProfileId, location.state]);

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    // Create socket only if it doesn't exist yet
    if (!socket) {
      socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });
    }

    // Set up socket event listeners
    const handleConnect = () => {
      console.log('Connected to WebSocket server');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from WebSocket server');
      setSocketConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      setUploadStatus({
        status: 'error',
        message: 'Failed to connect to server. Please try again later.',
      });
    };

    const handleProcessSuccess = (data: { processed_image: string; image_id: string }) => {
      console.log('Image processed successfully:', data.image_id);
      setIsUploading(false);
      setImageId(data.image_id);
      setProcessedImage(data.processed_image);
      setProcessedPreviewUrl(`data:image/png;base64,${data.processed_image}`);
      validateStep(0); // Re-validate step after image is processed
    };

    const handleProcessError = (error: { error: string }) => {
      console.error('Image processing error:', error);
      setIsUploading(false);
      setUploadStatus({
        status: 'error',
        message: error.error || 'Image processing failed',
      });
    };

    const handleUploadSuccess = (data: any) => {
      console.log('Item successfully stored on backend:', data);
      setIsUploading(false);
      setUploadStatus({
        status: 'success',
        message: isEditMode
          ? 'Item successfully updated in your wardrobe!'
          : 'Item successfully added to your wardrobe!',
      });

      // Navigate back to dashboard after successful upload
      setTimeout(() => {
        navigate('/dashboard', { state: { profileId: effectiveProfileId } });
        resetForm();
      }, 2000);
    };

    const handleUploadError = (error: { error: string }) => {
      console.error('Backend storage error:', error);
      setIsUploading(false);
      setUploadStatus({
        status: 'error',
        message: error.error || 'Failed to save item. Please try again.',
      });
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('process_success', handleProcessSuccess);
    socket.on('process_error', handleProcessError);
    socket.on('upload_success', handleUploadSuccess);
    socket.on('upload_error', handleUploadError);

    // Set initial connection state
    setSocketConnected(socket.connected);

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('process_success', handleProcessSuccess);
        socket.off('process_error', handleProcessError);
        socket.off('upload_success', handleUploadSuccess);
        socket.off('upload_error', handleUploadError);
      }
    };
  }, [navigate, effectiveProfileId, isEditMode]);

  /**
   * Fetch profile info when effectiveProfileId changes
   */
  useEffect(() => {
    const fetchProfileInfo = async () => {
      if (!effectiveProfileId) return;

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const profileDoc = doc(db, "profiles", effectiveProfileId);
        const profileSnap = await getDoc(profileDoc);

        if (!profileSnap.exists()) {
          console.error(`Profile not found for ID: ${effectiveProfileId}`);
          setUploadStatus({
            status: 'error',
            message: 'Profile not found. Please select a different profile.'
          });
          return;
        }

        const profileData = profileSnap.data();
        setProfileInfo({
          id: effectiveProfileId,
          uid: user.uid,
          name: profileData.name || 'Default Profile'
        });

        console.log("Successfully loaded profile:", effectiveProfileId, profileData.name);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setUploadStatus({
          status: 'error',
          message: 'Error loading profile information. Please try again.'
        });
      }
    };

    if (effectiveProfileId) {
      fetchProfileInfo();
    }
  }, [effectiveProfileId]);

  // Track validation errors for each step (now including gender selection)
  const [validationErrors, setValidationErrors] = useState({
    0: true, // Image upload
    1: true, // Gender selection (new)
    2: true, // Basic details
    3: true, // Colors
    4: true, // Additional info
  });

  const handleEditModeSteps = useCallback(() => {
    if (isEditMode && processedPreviewUrl && step === 0) {
      console.log("Edit mode with image data - skipping image upload step");
      // Auto-validate step 0 since we already have the image
      setValidationErrors(prev => ({ ...prev, 0: false }));
      // Automatically move to step 1
      setStep(1);
    }
  }, [isEditMode, processedPreviewUrl, step]);

  // Apply edit mode handling after component mount and edit data loaded
  useEffect(() => {
    if (isEditMode && processedPreviewUrl && step === 0) {
      // Small delay to ensure state is properly updated
      const timer = setTimeout(() => {
        handleEditModeSteps();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, processedPreviewUrl, step, handleEditModeSteps]);

  /**
   * Validates if the current step has all required data
   */
  const validateStep = useCallback((stepIndex: number) => {
    let isValid = false;

    switch (stepIndex) {
      case 0:
        // In edit mode, if we have a processed image, the step is valid
        if (isEditMode && processedImage !== null) {
          isValid = true;
        } else {
          isValid = selectedFile !== null && processedImage !== null;
        }
        break;
      case 1:
        // Validate gender selection
        isValid = Boolean(formData.gender);
        break;
      case 2:
        isValid = Boolean(
          formData.category &&
          formData.subcategory &&
          formData.size &&
          formData.brand?.trim()
        );
        break;
      case 3:
        isValid = Array.isArray(formData.colors) && formData.colors.length > 0;
        break;
      case 4:
        isValid = Boolean(formData.washingCondition);
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({ ...prev, [stepIndex]: !isValid }));
    return isValid;
  }, [selectedFile, processedImage, formData, isEditMode]);

  // Validate steps when dependencies change
  useEffect(() => {
    validateStep(0);
    validateStep(1);
    validateStep(2);
    validateStep(3);
    validateStep(4);
  }, [formData, selectedFile, processedImage, validateStep]);

  /**
   * Reset form state to initial values
   */
  const resetForm = useCallback(() => {
    setImageId(null);
    setOriginalImage(null);
    setProcessedImage(null);
    setSelectedFile(null);
    setOriginalPreviewUrl(null);
    setProcessedPreviewUrl(null);
    setFormData({
      gender: '',
      colors: [],
      brand: '',
      size: '',
      category: '',
      subcategory: '',
      washingCondition: '',
      notes: '',
      dateAdded: new Date().toISOString(),
    });
    setStep(0);
    setUploadStatus({ status: 'idle', message: '' });
  }, []);

  // Function to navigate to next step
  const goToNextStep = useCallback(() => {
    if (step < steps.length - 1 && !validationErrors[step]) {
      setStep(step + 1);
    }
  }, [step, validationErrors]);

  // Function to navigate to previous step
  const goToPrevStep = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  // Updated steps with gender selection
  const steps = [
    {
      number: 0,
      title: 'Upload Image',
      component: ImageUpload
    },
    {
      number: 1,
      title: 'Select Gender',
      component: GenderSelection
    },
    {
      number: 2,
      title: 'Basic Details',
      component: BasicDetails
    },
    {
      number: 3,
      title: 'Colors',
      component: ColorSelection
    },
    {
      number: 4,
      title: 'Additional Info',
      component: AdditionalInfo
    },
  ];

  // Set up swipe handlers with validation
  const handlers = useSwipeable({
    onSwipedLeft: () => !validationErrors[step] && goToNextStep(),
    onSwipedRight: () => goToPrevStep(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  /**
   * Handles file selection and initiates image processing
   */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    setUploadStatus({ status: 'idle', message: '' });

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setOriginalPreviewUrl(dataUrl);

        // Extract base64 data
        const base64Data = dataUrl.split(',')[1];
        setOriginalImage(base64Data);

        // Check if socket is connected
        if (!socket?.connected) {
          throw new Error("Socket not connected. Please refresh and try again.");
        }

        // Emit the image to the backend for processing
        socket.emit('process_image', {
          image: base64Data,
          filename: file.name
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File processing error:", error);
      setIsUploading(false);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process file. Please try again.',
      });
    }
  }, []);

  /**
   * Handles changes to form inputs
   */
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  }, []);

  /**
   * Handles final form submission through backend
   * Instead of directly uploading to Firebase from frontend
   */
  const handleSubmit = useCallback(async () => {
    // Validate connection, profile ID, and data
    if (!socketConnected || !socket?.connected) {
      setUploadStatus({ status: 'error', message: 'Not connected to server. Please refresh.' });
      return;
    }

    if (!effectiveProfileId) {
      setUploadStatus({ status: 'error', message: 'No profile selected. Please select a profile first.' });
      return;
    }

    // Fix: Modified logic for image validation in edit mode
    if ((!imageId || !processedImage) && !isEditMode) {
      setUploadStatus({ status: 'error', message: 'Missing required data. Please complete all steps.' });
      return;
    }

    if (validationErrors[4]) {
      setUploadStatus({ status: 'error', message: 'Please complete all required fields.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ status: 'idle', message: '' });

    try {
      // Get authentication
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in to upload items.');

      // Determine whether we're creating or updating
      const operationType = isEditMode ? 'update_item' : 'finalize_upload';
      console.log(`About to emit ${operationType} with image_id:`, imageId);

      // Add confirmation handlers for the upload events
      socket.on('upload_started', (response) => {
        console.log('Upload started:', response);
        setUploadStatus({ status: 'uploading', message: 'Upload started on server...' });
      });

      socket.on('upload_success', (response) => {
        console.log('Upload success:', response);
        setIsUploading(false);
        setUploadStatus({
          status: 'success',
          message: isEditMode ? 'Item updated successfully!' : 'Item uploaded successfully!'
        });
        // Additional success handling (like showing the item in a catalog, etc.)
      });

      socket.on('upload_error', (response) => {
        console.error('Upload error:', response);
        setIsUploading(false);
        setUploadStatus({ status: 'error', message: `Upload failed: ${response.error}` });
      });

      // Prepare the payload
      const payload = {
        user_id: user.uid,
        profile_id: effectiveProfileId,
        image_id: imageId,
        processed_image: processedImage,
        filename: selectedFile?.name || 'item.jpg',
        metadata: {
          gender: formData.gender || '', // Add gender field
          category: formData.category || '',
          sub_category: formData.subcategory || '',
          size: formData.size || '',
          brand: formData.brand || '',
          colors: formData.colors || [],
          washing_conditions: formData.washingCondition || 'Machine wash cold',
          notes: formData.notes || '',
          date_added: formData.dateAdded || new Date().toISOString(),
          profile_id: effectiveProfileId,
          user_id: user.uid
        }
      };

      // If editing, add the item ID
      if (isEditMode && itemId) {
        payload.item_id = itemId;
      }

      // Emit the appropriate event based on create/update
      socket.emit(operationType, payload);

      console.log(`Item data sent to backend for ${isEditMode ? 'update' : 'storage'}`);

    } catch (err) {
      console.error('Submission error:', err);
      setIsUploading(false);
      setUploadStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to upload. Please try again.',
      });
    }
  }, [
    socketConnected,
    socket,
    effectiveProfileId,
    imageId,
    processedImage,
    validationErrors,
    formData,
    selectedFile,
    isEditMode,
    itemId
  ]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  // Modify the component rendering to conditionally render based on edit mode
  const renderCurrentStep = () => {
    // If in edit mode and this is the image upload step, and we have an image already
    if (isEditMode && step === 0 && processedPreviewUrl) {
      return (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="w-full h-48 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center mb-4">
              <img
                src={processedPreviewUrl}
                alt="Existing Item"
                className="max-h-full object-contain"
              />
            </div>
            <p className="text-blue-600 font-medium">Existing image loaded successfully</p>
            <p className="text-gray-600 text-sm">You can continue to the next step</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNextStep}
            className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-xl shadow-sm hover:bg-blue-700"
          >
            Continue to Details
            <ArrowRight className="w-4 h-4 ml-1 inline" />
          </motion.button>
        </div>
      );
    }

    return React.createElement(steps[step].component, {
      formData,
      handleInputChange,
      validationErrors,
      selectedFile,
      setSelectedFile,
      originalPreviewUrl,
      processedPreviewUrl,
      isUploading,
      handleFileChange,
      currentColor,
      setCurrentColor,
      socketConnected
    });
  };

  return (
    <div {...handlers} className="min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #2196f3 100%)" }}>
      <ConnectionStatus socketConnected={socketConnected} />

      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">
          {isEditMode ? 'Edit Wardrobe Item' : 'Add to Wardrobe'}
        </h1>
        <p className="text-gray-700 mb-4">
          {isEditMode ? 'Update' : 'Upload a new'} clothing item to {profileInfo?.name || 'your'} wardrobe
          {!effectiveProfileId && <span className="text-red-600"> (No profile selected)</span>}
        </p>

        <TopImagePreview processedPreviewUrl={processedPreviewUrl} step={step} />

        <ProgressIndicator step={step} steps={steps} />

        <div className="mb-8 bg-white bg-opacity-90 backdrop-blur-md p-6 rounded-xl shadow-lg border border-blue-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <NavigationButtons
          step={step}
          steps={steps}
          validationErrors={validationErrors}
          isUploading={isUploading}
          goToPrevStep={goToPrevStep}
          goToNextStep={goToNextStep}
          handleSubmit={handleSubmit}
          hasProfileId={!!effectiveProfileId}
          isEditMode={isEditMode}
        />
      </div>

      <StatusMessage uploadStatus={uploadStatus} />
    </div>
  );
}

/**
 * Connection status indicator component
 */
function ConnectionStatus({ socketConnected }: { socketConnected: boolean }) {
  return !socketConnected ? (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center mb-4 mx-4 mt-4"
    >
      <AlertCircle className="w-4 h-4 mr-2" />
      Server connection lost. Waiting to reconnect...
    </motion.div>
  ) : null;
}

/**
 * Shows the processed image preview above the form
 */
function TopImagePreview({ processedPreviewUrl, step }: { processedPreviewUrl: string | null; step: number }) {
  if (!processedPreviewUrl || step === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-sm border border-blue-200 p-3 overflow-hidden"
    >
      <p className="text-sm text-gray-700 mb-2 font-medium">Your item:</p>
      <div className="w-full h-32 bg-blue-50 rounded-lg flex items-center justify-center">
        <img
          src={processedPreviewUrl}
          alt="Item Preview"
          className="max-h-full object-contain"
        />
      </div>
    </motion.div>
  );
}

/**
 * Step indicator component
 */
function ProgressIndicator({ step, steps }: { step: number; steps: { title: string; component: React.ComponentType<any> }[] }) {
  return (
    <div className="flex justify-between items-center w-full mb-6">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{
              scale: i === step ? 1.1 : 1,
              backgroundColor: i < step ? '#2196f3' : i === step ? '#1976d2' : '#e3f2fd',
              color: i < step ? '#ffffff' : i === step ? '#ffffff' : '#1976d2',
              borderColor: i === step ? '#1976d2' : 'transparent'
            }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2"
          >
            {i + 1}
          </motion.div>
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{
              opacity: i === step ? 1 : 0.5,
              fontWeight: i === step ? 600 : 400
            }}
            className="text-xs mt-1 text-gray-700 hidden sm:block"
          >
            {s.title}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

/**
 * Navigation buttons component
 */
function NavigationButtons({
  step,
  steps,
  validationErrors,
  isUploading,
  goToPrevStep,
  goToNextStep,
  handleSubmit,
  hasProfileId,
  isEditMode
}: {
  step: number;
  steps: any[];
  validationErrors: { [key: number]: boolean };
  isUploading: boolean;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  handleSubmit: () => void;
  hasProfileId: boolean;
  isEditMode: boolean;
}) {
  const buttonVariants = {
    disabled: { opacity: 0.5 },
    enabled: { opacity: 1 }
  };

  const isSubmitDisabled = validationErrors[step] || isUploading || !hasProfileId;

  return (
    <div className="flex justify-between">
      <motion.button
        variants={buttonVariants}
        initial="enabled"
        animate={step === 0 ? "disabled" : "enabled"}
        whileHover={step > 0 ? { scale: 1.05 } : {}}
        whileTap={step > 0 ? { scale: 0.95 } : {}}
        onClick={goToPrevStep}
        disabled={step === 0}
        className={`flex items-center justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium ${step === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </motion.button>

      {step < steps.length - 1 ? (
        <motion.button
          variants={buttonVariants}
          initial="enabled"
          animate={validationErrors[step] ? "disabled" : "enabled"}
          whileHover={!validationErrors[step] ? { scale: 1.05 } : {}}
          whileTap={!validationErrors[step] ? { scale: 0.95 } : {}}
          onClick={goToNextStep}
          disabled={validationErrors[step]}
          className={`flex items-center justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium ${validationErrors[step] ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-1" />
        </motion.button>
      ) : (
        <motion.button
          variants={buttonVariants}
          initial="enabled"
          animate={isSubmitDisabled ? "disabled" : "enabled"}
          whileHover={!isSubmitDisabled ? { scale: 1.05 } : {}}
          whileTap={!isSubmitDisabled ? { scale: 0.95 } : {}}
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`flex items-center justify-center py-2 px-6 border border-transparent rounded-xl shadow-sm text-sm font-medium ${isSubmitDisabled ? 'bg-purple-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditMode ? 'Updating...' : 'Uploading...'}
            </>
          ) : (
            <>
              {isEditMode ? 'Update Item' : 'Save to Wardrobe'}
              <CheckCircle className="w-4 h-4 ml-1" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

/**
 * Status message component - Updated with dark theme styling
 */
function StatusMessage({ uploadStatus }: { uploadStatus: { status: 'idle' | 'success' | 'error' | 'uploading'; message: string } }) {
  if (uploadStatus.status === 'idle') return null;

const getStatusStyles = () => {
  switch (uploadStatus.status) {
    case 'success':
      return {
        bgColor: 'bg-green-50 bg-opacity-95', // Light green background
        borderColor: 'border-green-300',
        iconColor: 'text-green-600',
        titleColor: 'text-green-800',
        messageColor: 'text-green-700',
        icon: CheckCircle,
        title: 'Success!'
      };
    case 'uploading':
      return {
        bgColor: 'bg-blue-50 bg-opacity-95', // Light blue background
        borderColor: 'border-blue-300',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-800',
        messageColor: 'text-blue-700',
        icon: 'spinner',
        title: 'Uploading...'
      };
    case 'error':
    default:
      return {
        bgColor: 'bg-red-50 bg-opacity-95', // Light red background
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        messageColor: 'text-red-700',
        icon: AlertCircle,
        title: 'Error'
      };
  }
};

const styles = getStatusStyles();
const IconComponent = styles.icon;

return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`fixed bottom-6 left-0 right-0 mx-auto w-11/12 max-w-md p-4 rounded-xl shadow-lg backdrop-blur-md ${styles.bgColor} ${styles.borderColor} border`}
  >
    <div className="flex items-start">
      {uploadStatus.status === 'uploading' ? (
        <svg
          className={`animate-spin w-5 h-5 ${styles.iconColor} mr-3 mt-0.5`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <IconComponent className={`w-5 h-5 ${styles.iconColor} mr-3 mt-0.5`} />
      )}
      <div>
        <p className={`text-sm font-medium ${styles.titleColor}`}>
          {styles.title}
        </p>
        <p className={`text-sm ${styles.messageColor}`}>
          {uploadStatus.message}
        </p>
      </div>
    </div>
  </motion.div>
);
}