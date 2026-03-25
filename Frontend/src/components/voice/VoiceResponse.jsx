import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  getTTSService,
  isTextToSpeechSupported,
  speakComplaintStatus,
  getPreferredLanguage 
} from '@/services/voiceService';

/**
 * Voice Response Component
 * Provides audio feedback for complaint status updates
 * Zero-Regression Strategy: Optional accessibility enhancement
 */

const VoiceResponse = ({ 
  enabled: initialEnabled = false,
  onEnabledChange,
  className = "" 
}) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language] = useState(getPreferredLanguage());
  const tts = getTTSService();

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('voice_response_enabled');
    if (saved !== null) {
      setIsEnabled(JSON.parse(saved));
    }
  }, []);

  const handleToggle = useCallback((value) => {
    setIsEnabled(value);
    localStorage.setItem('voice_response_enabled', JSON.stringify(value));
    
    if (onEnabledChange) {
      onEnabledChange(value);
    }

    // Announce change
    if (value && isTextToSpeechSupported()) {
      tts.speak('Voice responses enabled', { language });
    }
  }, [language, tts, onEnabledChange]);

  const stopSpeaking = useCallback(() => {
    tts.stop();
    setIsSpeaking(false);
  }, [tts]);

  // Monitor speaking state
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setIsSpeaking(tts.isSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, [isEnabled, tts]);

  if (!isTextToSpeechSupported()) {
    return null; // Fail silently if not supported
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Voice Response Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="voice-response"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="voice-response" className="text-sm cursor-pointer">
          Voice Responses
        </Label>
      </div>

      {/* Speaking Indicator & Stop Button */}
      <AnimatePresence>
        {isEnabled && isSpeaking && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex items-center gap-1 text-sm text-primary"
            >
              <Volume2 className="h-4 w-4" />
              <span className="font-medium">Speaking...</span>
            </motion.div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={stopSpeaking}
              className="h-7 gap-1"
              title="Stop speaking"
            >
              <VolumeX className="h-3 w-3" />
              <span className="text-xs">Stop</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Hook for voice notifications
 * Use this hook in components to announce status updates
 */
export const useVoiceNotifications = () => {
  const [language] = useState(getPreferredLanguage());
  const tts = getTTSService();

  const announceStatus = useCallback((status, complaintId) => {
    const isEnabled = localStorage.getItem('voice_response_enabled');
    if (isEnabled === 'true' && isTextToSpeechSupported()) {
      speakComplaintStatus(status, complaintId, language);
    }
  }, [language, tts]);

  const announce = useCallback((text, options = {}) => {
    const isEnabled = localStorage.getItem('voice_response_enabled');
    if (isEnabled === 'true' && isTextToSpeechSupported()) {
      tts.speak(text, { language, ...options });
    }
  }, [language, tts]);

  const stopAnnouncement = useCallback(() => {
    tts.stop();
  }, [tts]);

  return {
    announceStatus,
    announce,
    stopAnnouncement,
    isSupported: isTextToSpeechSupported(),
  };
};

export default VoiceResponse;
