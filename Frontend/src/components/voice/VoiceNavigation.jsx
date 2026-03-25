import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Navigation, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  parseNavigationCommand, 
  speakNavigationFeedback,
  speakError,
  getTTSService,
  isSpeechRecognitionSupported,
  getPreferredLanguage 
} from '@/services/voiceService';

/**
 * Voice Navigation Component
 * Enables voice-controlled navigation throughout the app
 * Zero-Regression Strategy: Optional enhancement, fail-safe design
 */

const VoiceNavigation = ({ className = "" }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState(getPreferredLanguage());
  const [recognitionRef, setRecognitionRef] = useState(null);

  const tts = getTTSService();

  // Route mapping
  const routeMap = {
    home: '/',
    dashboard: '/admin/dashboard',
    submit: '/submit',
    track: '/track',
    services: '/services',
    leaderboard: '/leaderboard',
    settings: '/settings',
    logout: '/auth',
  };

  const handleVoiceCommand = useCallback((command) => {
    if (!command) {
      speakError('no-command', language);
      toast({
        title: "Command not recognized",
        description: "Please try again with a valid command",
        variant: "destructive",
      });
      return;
    }

    const route = routeMap[command];
    if (route) {
      // Speak feedback
      speakNavigationFeedback(command, language);
      
      // Navigate
      setTimeout(() => {
        navigate(route);
        toast({
          title: "Navigation",
          description: `Navigating to ${command}`,
        });
      }, 800); // Short delay for voice feedback
    }
  }, [navigate, toast, language]);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        const results = event.results[0];
        const transcript = results[0].transcript;
        setTranscript(transcript);

        // Parse command
        const command = parseNavigationCommand(transcript, language);
        if (command) {
          handleVoiceCommand(command);
        } else {
          speakError('no-command', language);
        }
      };

      recognition.onerror = (event) => {
        console.error('Voice navigation error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'aborted') {
          speakError(event.error, language);
          toast({
            title: "Voice Error",
            description: `Error: ${event.error}`,
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setRecognitionRef(recognition);
    } catch (error) {
      console.error('Failed to start voice navigation:', error);
      toast({
        title: "Error",
        description: "Failed to start voice navigation",
        variant: "destructive",
      });
    }
  }, [language, handleVoiceCommand, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef) {
      recognitionRef.stop();
      setRecognitionRef(null);
    }
    setIsListening(false);
  }, [recognitionRef]);

  const toggleVoiceNavigation = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const toggleSpeaking = useCallback(() => {
    if (tts.isSpeaking()) {
      tts.stop();
      setIsSpeaking(false);
    }
  }, [tts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      tts.stop();
    };
  }, [stopListening, tts]);

  // Monitor TTS state
  useEffect(() => {
    const checkSpeaking = setInterval(() => {
      setIsSpeaking(tts.isSpeaking());
    }, 100);

    return () => clearInterval(checkSpeaking);
  }, [tts]);

  if (!isSpeechRecognitionSupported()) {
    return null; // Fail silently if not supported
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Voice Navigation Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={toggleVoiceNavigation}
          className="relative gap-2"
          title="Voice Navigation"
        >
          <Navigation className="h-4 w-4" />
          <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
          
          {/* Listening indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 rounded-md border-2 border-destructive animate-pulse pointer-events-none"
              />
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Stop Speaking Button (when active) */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSpeaking}
              className="gap-2"
              title="Stop Speaking"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="px-3 py-1 bg-muted rounded-md text-sm"
          >
            {isListening ? (
              <span className="text-muted-foreground italic">Listening for command...</span>
            ) : transcript ? (
              <span className="text-foreground">{transcript}</span>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceNavigation;
