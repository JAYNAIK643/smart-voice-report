import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  isSpeechRecognitionSupported,
  getPreferredLanguage,
  getTTSService 
} from '@/services/voiceService';

/**
 * Voice Search Component
 * Natural language voice search for complaints and issues
 * Zero-Regression Strategy: Standalone component, optional enhancement
 */

const VoiceSearch = ({ 
  onSearch,
  placeholder = "Search by voice or text...",
  className = "",
  autoFocus = false 
}) => {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [language] = useState(getPreferredLanguage());

  const tts = getTTSService();

  const startVoiceSearch = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setSearchText('');
      };

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update search text with interim or final result
        if (finalTranscript) {
          setSearchText(finalTranscript);
          setIsProcessing(true);
          
          // Execute search
          setTimeout(() => {
            if (onSearch) {
              onSearch(finalTranscript);
            }
            setIsProcessing(false);
          }, 300);
        } else {
          setSearchText(interimTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Voice search error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        if (event.error !== 'aborted') {
          const errorMessages = {
            'not-allowed': 'Microphone access denied',
            'no-speech': 'No speech detected',
            'network': 'Network error',
          };
          
          toast({
            title: "Voice Search Error",
            description: errorMessages[event.error] || `Error: ${event.error}`,
            variant: "destructive",
          });
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);
    } catch (error) {
      console.error('Failed to start voice search:', error);
      toast({
        title: "Error",
        description: "Failed to start voice search",
        variant: "destructive",
      });
    }
  }, [language, onSearch, toast]);

  const stopVoiceSearch = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  }, [recognition]);

  const handleTextSearch = useCallback((e) => {
    e.preventDefault();
    if (searchText.trim() && onSearch) {
      onSearch(searchText.trim());
    }
  }, [searchText, onSearch]);

  const clearSearch = useCallback(() => {
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopVoiceSearch();
      tts.stop();
    };
  }, [stopVoiceSearch, tts]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleTextSearch} className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        
        {/* Search Input */}
        <Input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-24"
          disabled={isListening || isProcessing}
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear Button */}
          <AnimatePresence>
            {searchText && !isListening && !isProcessing && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-7 w-7 p-0"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Search Button */}
          {isSpeechRecognitionSupported() && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="button"
                variant={isListening ? "destructive" : "ghost"}
                size="sm"
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                disabled={isProcessing}
                className="h-7 w-7 p-0 relative"
                title={isListening ? "Stop voice search" : "Voice search"}
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mic className={`h-3 w-3 ${isListening ? 'animate-pulse' : ''}`} />
                )}
                
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
          )}
        </div>
      </form>

      {/* Listening Feedback */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="h-4 w-4 text-destructive" />
              </motion.div>
              <span className="text-sm text-destructive font-medium">
                Listening... speak your search query
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Feedback */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">
                Searching...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearch;
