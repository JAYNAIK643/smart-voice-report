import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Check } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  SUPPORTED_LANGUAGES,
  getPreferredLanguage,
  setPreferredLanguage 
} from '@/services/voiceService';

/**
 * Enhanced Voice Input with Multilingual Support
 * Extends existing VoiceInput component with language selection
 * Zero-Regression Strategy: Wraps existing component without modification
 */

const EnhancedVoiceInput = ({
  onTranscript,
  onPartialTranscript,
  placeholder,
  className = "",
  showLanguageSelector = true,
  ...props
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(getPreferredLanguage());
  const [customPlaceholder, setCustomPlaceholder] = useState(placeholder);

  const handleLanguageChange = useCallback((langCode) => {
    setSelectedLanguage(langCode);
    setPreferredLanguage(langCode);
    
    // Update placeholder based on language
    const placeholders = {
      'en-US': 'Click to speak in English...',
      'en-GB': 'Click to speak in English...',
      'hi-IN': 'बोलने के लिए क्लिक करें...',
      'mr-IN': 'बोलण्यासाठी क्लिक करा...',
    };
    
    setCustomPlaceholder(placeholders[langCode] || placeholder);
  }, [placeholder]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        {showLanguageSelector && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                title="Select Language"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs">
                  {SUPPORTED_LANGUAGES[selectedLanguage]?.flag}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className="gap-2"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                  {selectedLanguage === code && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Original Voice Input Component */}
        <div className="flex-1">
          <VoiceInput
            onTranscript={onTranscript}
            onPartialTranscript={onPartialTranscript}
            placeholder={customPlaceholder || placeholder}
            {...props}
          />
        </div>
      </div>

      {/* Language Info */}
      <AnimatePresence>
        {showLanguageSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground px-1"
          >
            Speaking in: <span className="font-medium">{SUPPORTED_LANGUAGES[selectedLanguage]?.name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedVoiceInput;
