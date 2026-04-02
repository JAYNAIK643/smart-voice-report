// import { authService } from "@/services/authService";
 //Updated

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useComplaints } from "@/context/complaints-context";
import { useAuth } from "@/context/auth-context";
import { ChevronLeft, ChevronRight, Check, Upload, Copy, Sparkles, AlertTriangle, Zap, Loader2, X, MapPin, Mic } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import ConfettiEffect, { useConfetti } from "@/components/ConfettiEffect";
import AIComplaintAnalyzer from "@/components/ai/AIComplaintAnalyzer";
import SentimentAnalyzer from "@/components/ai/SentimentAnalyzer";
import VoiceFormControl from "@/components/voice/VoiceFormControl";

const steps = ["Personal Info", "Issue Details", "Location & Media", "Review"];

const serviceCategories = [
  "Waste Management",
  "Water Supply",
  "Road Maintenance",
  "Street Lighting",
  "Parks & Gardens",
  "Public Buildings",
  "Other",
];

// Map AI categories to form categories
const categoryMapping = {
  "Garbage Collection": "Waste Management",
  "Water Supply": "Water Supply",
  "Road Maintenance": "Road Maintenance",
  "Street Lighting": "Street Lighting",
  "Parks & Gardens": "Parks & Gardens",
  "Public Buildings": "Public Buildings",
  "Other": "Other",
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const CATEGORIZE_URL = `${BACKEND_URL}/api/ai/categorize`;

const SubmitComplaint = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const location = useLocation();
  const { toast } = useToast();
  const { addComplaint } = useComplaints();
  const { user } = useAuth();
  const { isActive: showConfetti, trigger: triggerConfetti, reset: resetConfetti } = useConfetti();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: location.state?.service || "",
    title: "",
    description: "",
    address: "",
    ward: "", // Add ward field
    file: null,
  });

  // Geolocation state
  const [geolocation, setGeolocation] = useState({ latitude: null, longitude: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  
  // Video upload state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // AI Categorization state
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState(null); // New state for full AI analysis

  // Debounce timer for AI categorization
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Capture geolocation when user reaches Location step
  const captureGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoLoading(false);
        toast({
          title: "Location captured",
          description: "Your current location has been recorded.",
        });
      },
      (error) => {
        setGeoLoading(false);
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setGeoError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [toast]);

  // Auto-capture geolocation when entering Location step
  useEffect(() => {
    if (currentStep === 2 && !geolocation.latitude && !geoLoading) {
      captureGeolocation();
    }
  }, [currentStep, geolocation.latitude, geoLoading, captureGeolocation]);

  // Handle chatbot auto-fill data
  useEffect(() => {
    const chatbotData = sessionStorage.getItem('chatbot-auto-fill');
    if (chatbotData) {
      try {
        const data = JSON.parse(chatbotData);
        
        // Map category from chatbot to form
        const categoryMap = {
          'Street Light': 'Street Lighting',
          'Roads': 'Road Maintenance',
          'Garbage': 'Waste Management',
          'Water Supply': 'Water Supply',
          'Sewerage': 'Other',
          'Public Building': 'Public Buildings',
          'Parks': 'Parks & Gardens',
          'Others': 'Other'
        };
        
        setFormData(prev => ({
          ...prev,
          category: categoryMap[data.category] || data.category || prev.category,
          description: data.description || prev.description,
          address: data.location || prev.address,
        }));
        
        // Show toast notification
        toast({
          title: "Form Auto-Filled",
          description: `Category: ${data.category}. Please review and add any missing details.`,
        });
        
        // Clear the data after using it
        sessionStorage.removeItem('chatbot-auto-fill');
        
        // Auto-trigger camera if requested
        if (data.autoTriggerCamera && cameraInputRef.current) {
          setTimeout(() => {
            cameraInputRef.current.click();
          }, 1000);
        }
      } catch (error) {
        console.error('Error parsing chatbot data:', error);
      }
    }
  }, [toast]);

  // Convert file to base64 for storage
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Compress image to ensure it's under 1MB
  const compressImage = async (file, maxWidth = 1280, maxHeight = 1280, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image file selection with compression
  const handleImageSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
      });
      return;
    }

    setImageProcessing(true);

    try {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Compress if file is larger than 500KB
      let processedFile = file;
      if (file.size > 500 * 1024) {
        processedFile = await compressImage(file);
        console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(processedFile.size / 1024).toFixed(1)}KB`);
      }

      // Final size check
      if (processedFile.size > 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Even after compression, image exceeds 1MB. Please try a different image.",
        });
        setImagePreview(null);
        setImageProcessing(false);
        return;
      }

      setFormData({ ...formData, file: processedFile });
      toast({
        title: "Image ready",
        description: `Image size: ${(processedFile.size / 1024).toFixed(1)}KB`,
      });
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: "Failed to process image. Please try again.",
      });
      setImagePreview(null);
    } finally {
      setImageProcessing(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, file: null });
  };

  // Handle video file selection
  const handleVideoSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid video format",
        description: "Please select MP4, WebM, or QuickTime video",
      });
      return;
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Video too large",
        description: "Maximum video size is 20MB",
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    
    // Upload video immediately
    await uploadVideo(file);
  };

  // Upload video to server
  const uploadVideo = async (file) => {
    setVideoUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`${BACKEND_URL}/api/video/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setVideoUrl(data.data.videoUrl);
        toast({
          title: "Video uploaded",
          description: "Video ready for submission",
        });
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Video upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload video",
      });
      // Clear video on error
      setVideoFile(null);
      setVideoPreview(null);
    } finally {
      setVideoUploading(false);
    }
  };

  // Remove selected video
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoUrl(null);
  };

  // Trigger AI categorization when description changes
  useEffect(() => {
    if (formData.description.length < 20 || suggestionAccepted) return;
    
    // Clear existing timer
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Set new timer for debounced categorization
    const timer = setTimeout(() => {
      categorizeComplaint();
    }, 1500); // Wait 1.5 seconds after user stops typing
    
    setDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData.description, formData.title]);

  const categorizeComplaint = async () => {
    if (!formData.description || formData.description.length < 20) return;
    
    setIsAnalyzing(true);
    setSuggestionDismissed(false);
    
    try {
      const response = await fetch(CATEGORIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          title: formData.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to categorize");
      }

      const result = await response.json();
      console.log("AI categorization result:", result);
      
      // Map the AI category to form category
      const mappedCategory = categoryMapping[result.category] || result.category;
      
      setAiSuggestion({
        ...result,
        mappedCategory,
      });
    } catch (error) {
      console.error("Categorization error:", error);
      // Silent fail - don't show error to user, just skip suggestion
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion?.mappedCategory) {
      setFormData(prev => ({
        ...prev,
        category: aiSuggestion.mappedCategory,
      }));
      setSuggestionAccepted(true);
      toast({
        title: "Category applied",
        description: `Set to "${aiSuggestion.mappedCategory}" based on AI analysis.`,
      });
    }
  };

  const dismissSuggestion = () => {
    setSuggestionDismissed(true);
    setAiSuggestion(null);
  };

  // Handle AI Analysis acceptance from new component
  const handleAcceptAI = (data) => {
    setFormData(prev => ({
      ...prev,
      category: data.category,
      priority: data.priority,
    }));
    setAiAnalysisData(data.aiAnalysis);
    setSuggestionAccepted(true);
    toast({
      title: "AI Suggestions Applied",
      description: `Category: ${data.category}, Priority: ${data.priority}`,
    });
  };

  const handleDismissAI = () => {
    setAiAnalysisData(null);
    setSuggestionDismissed(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    // Support both event-triggered and voice-triggered submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    try {
      const token = localStorage.getItem("authToken");

      // Validate file size before upload (1MB max)
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
      if (formData.file && formData.file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Image size must be less than 1MB. Please choose a smaller image.",
        });
        return; // Don't send request to backend
      }

      // Convert image to base64 if file is uploaded
      let imageUrl = null;
      if (formData.file) {
        try {
          imageUrl = await fileToBase64(formData.file);
        } catch (err) {
          console.error("Error converting file to base64:", err);
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/grievances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          address: formData.address,
          ward: formData.ward, // Include ward field
          priority: "high",
          // Image, video and geolocation data
          imageUrl: imageUrl,
          videoUrl: videoUrl, // Include video URL if uploaded
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle image validation errors specifically
        if (result.errorType === 'IMAGE_VALIDATION_FAILED') {
          toast({
            variant: "destructive",
            title: "Invalid Image",
            description: result.message || "Uploaded image is not valid. Please upload a relevant real image.",
          });
          return;
        }
        throw new Error(result.message || "Failed to submit grievance");
      }

      // ✅ SUCCESS: Reset form and show simple message
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: location.state?.service || "",
        title: "",
        description: "",
        address: "",
        ward: "", // Reset ward field
        file: null,
      });
      setCurrentStep(0);
      setAiSuggestion(null);
      setSuggestionAccepted(false);
      setSuggestionDismissed(false);
      setGeolocation({ latitude: null, longitude: null });
      setGeoError(null);
      setImagePreview(null); // Reset image preview
      setImageProcessing(false);

      toast({
        title: "Success!",
        description: "Complaint submitted successfully. Complaint ID has been sent to your email.",
      });

      // Trigger confetti celebration
      triggerConfetti();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.6) return "text-primary";
    if (confidence >= 0.4) return "text-warning";
    return "text-muted-foreground";
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return { color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle, label: 'Critical Priority', pulse: true };
      case 'high':
        return { color: 'bg-warning text-warning-foreground', icon: Zap, label: 'High Priority', pulse: true };
      case 'medium':
        return { color: 'bg-primary text-primary-foreground', icon: null, label: 'Medium Priority', pulse: false };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: null, label: 'Normal Priority', pulse: false };
    }
  };

  return (
    <>
      {/* Confetti Effect */}
      <ConfettiEffect 
        isActive={showConfetti} 
        onComplete={resetConfetti}
        originX="50%"
        originY="40%"
      />
      
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold mb-4">
            Submit a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Complaint
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us serve you better by providing detailed information
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative z-10">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index <= currentStep
                        ? "gradient-button text-white shadow-glow"
                        : "bg-muted text-muted-foreground"
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {index < currentStep ? <Check size={20} /> : index + 1}
                  </motion.div>
                  <span className="text-sm mt-2 text-center hidden sm:block">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-4 bg-muted relative">
                    <motion.div
                      className="h-full gradient-button"
                      initial={{ width: 0 }}
                      animate={{ width: index < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Voice Control Panel */}
        <div className="mb-8">
          <VoiceFormControl
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            onSubmit={handleSubmit}
            totalSteps={steps.length}
            showVisualization={true}
          />
        </div>

        {/* Form */}
        <motion.div
          className="bg-card rounded-3xl shadow-elevated p-8 border border-border"
          layout
        >
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 0: Personal Info */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {/* Step 1: Issue Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="category">Service Category *</Label>
                      <div className="relative mt-2">
                        <select
                          id="category"
                          required
                          value={formData.category}
                          onChange={(e) => {
                            setFormData({ ...formData, category: e.target.value });
                            if (suggestionAccepted && e.target.value !== aiSuggestion?.mappedCategory) {
                              setSuggestionAccepted(false);
                            }
                          }}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="">Select a category</option>
                          {serviceCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        
                        {/* AI Suggestion Badge on Category */}
                        {suggestionAccepted && formData.category === aiSuggestion?.mappedCategory && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI Suggested
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">Complaint Title *</Label>
                      <Input
                        id="title"
                        required
                        placeholder="Brief description of the issue"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Detailed Description *</Label>
                      <div className="mt-2 space-y-2">
                        <div className="relative">
                          <Textarea
                            id="description"
                            required
                            placeholder="Provide detailed information about the issue..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-32 pr-12"
                          />
                          <div className="absolute top-2 right-2">
                            <VoiceInput
                              buttonOnly
                              size="sm"
                              onTranscript={(text) => setFormData(prev => ({
                                ...prev,
                                description: prev.description ? `${prev.description} ${text}` : text
                              }))}
                              onPartialTranscript={(text) => {
                                // Show partial transcript as preview
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>💡</span> Click the microphone to use voice input
                        </p>
                      </div>
                    </div>

                    {/* NEW: AI Complaint Analyzer Component */}
                    {formData.title && formData.description && formData.ward && formData.description.length >= 20 && !suggestionAccepted && (
                      <AIComplaintAnalyzer
                        title={formData.title}
                        description={formData.description}
                        ward={formData.ward}
                        onAccept={handleAcceptAI}
                        onDismiss={handleDismissAI}
                        autoAnalyze={true}
                      />
                    )}

                    {/* NEW: Sentiment Analyzer Component */}
                    {formData.description && formData.description.length >= 20 && (
                      <SentimentAnalyzer
                        text={`${formData.title} ${formData.description}`}
                        includeInsights={true}
                        showBreakdown={true}
                        autoAnalyze={true}
                      />
                    )}

                    {/* AI Analyzing Indicator */}
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI is analyzing your complaint...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* AI Suggestion Card */}
                    <AnimatePresence>
                      {aiSuggestion && !suggestionAccepted && !suggestionDismissed && !isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4"
                        >
                          {/* Animated shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                          />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ rotate: [0, 15, -15, 0] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                >
                                  <Sparkles className="w-5 h-5 text-primary" />
                                </motion.div>
                                <span className="font-semibold text-foreground">AI Suggestion</span>
                                <span className={`text-sm font-medium ${getConfidenceColor(aiSuggestion.confidence)}`}>
                                  {Math.round(aiSuggestion.confidence * 100)}% confident
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={dismissSuggestion}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="mt-3 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm text-muted-foreground">Suggested category:</span>
                                <motion.span
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                  className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium text-sm"
                                >
                                  {aiSuggestion.mappedCategory}
                                </motion.span>
                              </div>
                              
                              {/* Priority Badge */}
                              {aiSuggestion.priority && aiSuggestion.priority !== 'low' && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-2"
                                >
                                  {(() => {
                                    const config = getPriorityConfig(aiSuggestion.priority);
                                    const Icon = config.icon;
                                    return (
                                      <motion.span
                                        animate={config.pulse ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${config.color}`}
                                      >
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        {config.label}
                                      </motion.span>
                                    );
                                  })()}
                                  {aiSuggestion.urgencyKeywords?.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      Detected: {aiSuggestion.urgencyKeywords.slice(0, 3).join(', ')}
                                    </span>
                                  )}
                                </motion.div>
                              )}
                              
                              {aiSuggestion.reasoning && (
                                <p className="text-sm text-muted-foreground italic">
                                  "{aiSuggestion.reasoning}"
                                </p>
                              )}
                              
                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={acceptSuggestion}
                                  className="gradient-button text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept Suggestion
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={dismissSuggestion}
                                >
                                  Choose Different
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Step 2: Location & Media */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="address">Location Address *</Label>
                      <Textarea
                        id="address"
                        required
                        placeholder="Enter the exact location of the issue"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    
                    {/* Ward Selection Dropdown */}
                    <div>
                      <Label htmlFor="ward">Select Ward *</Label>
                      <select
                        id="ward"
                        required
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
                      >
                        <option value="">Choose a ward</option>
                        <option value="Ward 1">Ward 1</option>
                        <option value="Ward 3">Ward 3</option>
                      </select>
                    </div>

                    {/* Geolocation Status */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <Label className="font-medium">GPS Location</Label>
                      </div>
                      {geoLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Capturing your location...</span>
                        </div>
                      ) : geolocation.latitude ? (
                        <div className="space-y-1">
                          <p className="text-sm text-success flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Location captured successfully
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Coordinates: {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
                          </p>
                        </div>
                      ) : geoError ? (
                        <div className="space-y-2">
                          <p className="text-sm text-destructive">{geoError}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={captureGeolocation}
                            className="mt-1"
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={captureGeolocation}
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Capture Location
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Location helps Ward Admin find the exact issue spot
                      </p>
                    </div>
                    
                    <div>
                      <Label>Upload Photo/Document (Optional)</Label>
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-4 relative inline-block"
                        >
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg border border-border shadow-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            disabled={imageProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {imageProcessing && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Dual Upload Options */}
                      {!imagePreview && (
                        <div className="mt-2 space-y-3">
                          {/* Camera Button - Mobile */}
                          <label 
                            htmlFor="camera-capture"
                            className="flex items-center justify-center gap-3 border-2 border-primary/50 bg-primary/5 rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <span className="text-2xl">📷</span>
                            <div className="text-left">
                              <p className="font-medium text-sm">Take Photo</p>
                              <p className="text-xs text-muted-foreground">Open camera to capture</p>
                            </div>
                          </label>
                          <input
                            ref={cameraInputRef}
                            id="camera-capture"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelect(file);
                            }}
                            className="hidden"
                          />

                          {/* Gallery Button */}
                          <label 
                            htmlFor="gallery-upload"
                            className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium text-sm">Choose from Gallery</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max. 1MB)</p>
                            </div>
                          </label>
                          <input
                            ref={galleryInputRef}
                            id="gallery-upload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelect(file);
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* File Info */}
                      {formData.file && !imageProcessing && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-success font-medium flex items-center gap-2"
                        >
                          <Check size={16} />
                          Ready: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)}KB)
                        </motion.p>
                      )}
                    </div>

                    {/* Video Upload Section */}
                    <div className="border-t border-border pt-6 mt-6">
                      <Label>Upload Video (Optional)</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Record a short video (max 20MB, MP4/WebM)
                      </p>
                      
                      {/* Video Preview */}
                      {videoPreview && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-4 relative"
                        >
                          <video 
                            src={videoPreview} 
                            controls
                            className="max-h-48 w-full rounded-lg border border-border shadow-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeVideo}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            disabled={videoUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {videoUploading && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <span className="ml-2 text-sm">Uploading...</span>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Video Upload Options */}
                      {!videoPreview && (
                        <div className="mt-2 space-y-3">
                          {/* Record Video Button */}
                          <label 
                            htmlFor="video-capture"
                            className="flex items-center justify-center gap-3 border-2 border-primary/50 bg-primary/5 rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <span className="text-2xl">🎥</span>
                            <div className="text-left">
                              <p className="font-medium text-sm">Record Video</p>
                              <p className="text-xs text-muted-foreground">Max 20 seconds recommended</p>
                            </div>
                          </label>
                          <input
                            ref={videoInputRef}
                            id="video-capture"
                            type="file"
                            accept="video/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoSelect(file);
                            }}
                            className="hidden"
                          />

                          {/* Gallery Video Button */}
                          <label 
                            htmlFor="video-gallery"
                            className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium text-sm">Choose Video from Gallery</p>
                              <p className="text-xs text-muted-foreground">MP4 or WebM (max. 20MB)</p>
                            </div>
                          </label>
                          <input
                            id="video-gallery"
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoSelect(file);
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* Video Upload Status */}
                      {videoUrl && !videoUploading && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-success font-medium flex items-center gap-2"
                        >
                          <Check size={16} />
                          Video uploaded successfully
                        </motion.p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold mb-6">Review Your Complaint</h3>
                    <div className="grid gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="font-medium">{formData.name}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{formData.email}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg relative">
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div className="font-medium flex items-center gap-2">
                          {formData.category}
                          {suggestionAccepted && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                            >
                              <Sparkles className="w-3 h-3" />
                              AI Suggested
                            </motion.span>
                          )}
                        </div>
                      </div>
                      
                      {/* Priority indicator in review */}
                      {aiSuggestion?.priority && aiSuggestion.priority !== 'low' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-muted rounded-lg"
                        >
                          <div className="text-sm text-muted-foreground">Detected Priority</div>
                          <div className="font-medium flex items-center gap-2 mt-1">
                            {(() => {
                              const config = getPriorityConfig(aiSuggestion.priority);
                              const Icon = config.icon;
                              return (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${config.color}`}>
                                  {Icon && <Icon className="w-3.5 h-3.5" />}
                                  {config.label}
                                </span>
                              );
                            })()}
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Title</div>
                        <div className="font-medium">{formData.title}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Description</div>
                        <div className="font-medium">{formData.description}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">{formData.address}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Ward</div>
                        <div className="font-medium">{formData.ward}</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="mr-2" />
                Back
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  variant="hero"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="ml-2" />
                </Button>
              ) : (
                <Button type="submit" variant="success" className="flex-1">
                  <Check className="mr-2" />
                  Submit Complaint
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
      </main>
    </>
  );
};

export default SubmitComplaint;
