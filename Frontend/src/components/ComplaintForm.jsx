import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const COMPLAINT_TYPES = [
  { value: 'Waste Management', label: '🗑️ Waste Management', keywords: ['garbage', 'trash', 'waste'] },
  { value: 'Road Maintenance', label: '🛣️ Road Maintenance', keywords: ['pothole', 'road', 'damage'] },
  { value: 'Water Supply', label: '💧 Water Supply', keywords: ['water', 'leak', 'pipe'] },
  { value: 'Street Lighting', label: '💡 Street Lighting', keywords: ['light', 'lamp', 'pole'] },
  { value: 'Parks & Gardens', label: '🌳 Parks & Gardens', keywords: ['tree', 'park', 'garden'] },
  { value: 'Public Buildings', label: '🏢 Public Buildings', keywords: ['building', 'wall', 'roof'] },
  { value: 'Other', label: '📋 Other', keywords: [] },
];

const ComplaintForm = ({ onImageValidated, onValidationStart, existingImageUrl = null }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [complaintType, setComplaintType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingImageUrl);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, or WebP)',
      });
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Image size must be less than 2MB',
      });
      return;
    }
    
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setValidationResult(null);
    
    // Auto-validate if complaint type is selected
    if (complaintType && complaintType !== 'Other') {
      validateImage(file, complaintType);
    }
  };

  // Validate image with backend
  const validateImage = async (file, type) => {
    if (!file || !type) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select both an image and complaint type',
      });
      return;
    }
    
    setIsValidating(true);
    setUploadProgress(0);
    onValidationStart?.();
    
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('image', file);
      formData.append('complaintType', type);
      
      const response = await fetch(`${BACKEND_URL}/api/image/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Validation failed');
      }
      
      // Validation successful
      setValidationResult({
        isValid: true,
        ...result.data,
      });
      
      toast({
        title: '✅ Image validated',
        description: `Confidence: ${(result.data.validation.confidence * 100).toFixed(0)}%`,
      });
      
      // Notify parent component
      onImageValidated?.({
        imageUrl: result.data.imageUrl,
        imageHash: result.data.imageHash,
        validation: result.data.validation,
      });
      
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error.message,
      });
      
      toast({
        variant: 'destructive',
        title: '❌ Image validation failed',
        description: error.message,
      });
    } finally {
      setIsValidating(false);
      setUploadProgress(100);
    }
  };

  // Handle form submit (validate button)
  const handleValidateClick = () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No image selected',
        description: 'Please select an image to validate',
      });
      return;
    }
    
    if (!complaintType) {
      toast({
        variant: 'destructive',
        title: 'No complaint type',
        description: 'Please select a complaint type',
      });
      return;
    }
    
    validateImage(selectedFile, complaintType);
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setValidationResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Handle complaint type change
  const handleComplaintTypeChange = (e) => {
    const type = e.target.value;
    setComplaintType(type);
    setValidationResult(null);
    
    // Auto-validate if file is already selected
    if (selectedFile && type && type !== 'Other') {
      validateImage(selectedFile, type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Complaint Type Dropdown */}
      <div>
        <Label htmlFor="complaintType">Complaint Type *</Label>
        <select
          id="complaintType"
          value={complaintType}
          onChange={handleComplaintTypeChange}
          className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
        >
          <option value="">Select complaint type</option>
          {COMPLAINT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {complaintType && complaintType !== 'Other' && (
          <p className="text-xs text-muted-foreground mt-1">
            Expected objects: {COMPLAINT_TYPES.find(t => t.value === complaintType)?.keywords.join(', ')}
          </p>
        )}
      </div>

      {/* Image Upload Section */}
      <div>
        <Label>Upload Image *</Label>
        
        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-2 relative inline-block"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-border shadow-md"
              />
              
              {/* Remove button */}
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Validation indicator */}
              {validationResult && (
                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  validationResult.isValid
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Invalid
                    </>
                  )}
                </div>
              )}
              
              {/* Loading overlay */}
              {isValidating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <span className="text-sm">Validating...</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Buttons */}
        {!imagePreview && (
          <div className="mt-2 space-y-3">
            {/* Camera Button */}
            <label
              htmlFor="camera-capture"
              className="flex items-center justify-center gap-3 border-2 border-primary/50 bg-primary/5 rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Camera className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Take Photo</p>
                <p className="text-xs text-muted-foreground">Capture issue directly</p>
              </div>
            </label>
            <input
              ref={cameraInputRef}
              id="camera-capture"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
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
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP (max 2MB)</p>
              </div>
            </label>
            <input
              ref={fileInputRef}
              id="gallery-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        )}

        {/* File info */}
        {selectedFile && !isValidating && (
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
          </p>
        )}
      </div>

      {/* Validation Result Details */}
      <AnimatePresence>
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              validationResult.isValid
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}
          >
            {validationResult.isValid ? (
              <div className="space-y-2">
                <p className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Image Validated Successfully
                </p>
                {validationResult.validation?.detectedObjects?.length > 0 && (
                  <div className="text-sm text-green-600 dark:text-green-500">
                    <p>Detected objects:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {validationResult.validation.detectedObjects.map((obj, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-xs ${
                            validationResult.validation.matchedObjects?.some(
                              m => m.class === obj.class
                            )
                              ? 'bg-green-200 dark:bg-green-800'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          {obj.class} ({(obj.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Image Validation Failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {validationResult.error}
                </p>
                {validationResult.details?.detectedObjects?.length > 0 && (
                  <p className="text-xs text-red-500">
                    Detected: {validationResult.details.detectedObjects.map(o => o.class).join(', ')}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Validate Button */}
      {selectedFile && complaintType && !validationResult && !isValidating && (
        <Button
          type="button"
          onClick={handleValidateClick}
          className="w-full"
        >
          Validate Image
        </Button>
      )}
    </div>
  );
};

export default ComplaintForm;
