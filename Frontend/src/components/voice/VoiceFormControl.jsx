/**
 * VoiceFormControl Component
 * Provides voice control UI for form filling with multi-language support
 * Features: Start/Stop button, language selector, status display, help modal
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, VolumeX, Globe, HelpCircle,
  AlertCircle, CheckCircle2, Loader2, X, ChevronDown,
  Settings2, Pause, Play, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  SUPPORTED_LANGUAGES,
  RECOGNITION_STATES,
  createFormSpeechRecognition,
  getPreferredLanguage,
  setPreferredLanguage,
  getTTSService,
  speakFormFeedback,
} from '@/services/voiceService';
import {
  processCommand,
  COMMAND_TYPES,
  getAvailableCommands,
  getFeedbackMessage,
} from '@/services/commandProcessor';
import {
  createFormVoiceController,
  getStepHints,
  getStepName,
} from '@/services/formVoiceController';

// Audio visualizer component
const AudioVisualizer = ({ isListening, analyserNode }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isListening || !analyserNode || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isListening) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Gradient from primary to secondary color
        const hue = 220 + (i / bufferLength) * 40;
        ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={32}
      className="rounded-sm"
    />
  );
};

// Microphone button with animation
const MicButton = ({ isListening, isPaused, isError, onClick, size = 'default' }) => {
  const sizeClasses = {
    sm: 'h-10 w-10',
    default: 'h-12 w-12',
    lg: 'h-14 w-14',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-full
        ${sizeClasses[size]}
        ${isListening ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}
        ${isError ? 'bg-destructive text-destructive-foreground' : ''}
        ${isPaused ? 'bg-yellow-500 text-white' : ''}
        shadow-lg hover:shadow-xl transition-shadow
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulse animation when listening */}
      {isListening && !isPaused && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Icon */}
      {isListening && !isPaused ? (
        <MicOff className="h-6 w-6 relative z-10" />
      ) : isPaused ? (
        <Pause className="h-6 w-6 relative z-10" />
      ) : isError ? (
        <AlertCircle className="h-6 w-6 relative z-10" />
      ) : (
        <Mic className="h-6 w-6 relative z-10" />
      )}
    </motion.button>
  );
};

// Language selector component
const LanguageSelector = ({ currentLanguage, onLanguageChange, disabled }) => {
  const languages = Object.values(SUPPORTED_LANGUAGES);
  const current = SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES['en-US'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.nativeName}</span>
          <span className="sm:hidden">{current.flag}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className="gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.nativeName}</span>
            {lang.code === currentLanguage && (
              <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Help dialog with available commands
const HelpDialog = ({ open, onClose, language }) => {
  const commands = useMemo(() => getAvailableCommands(language), [language]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Voice Commands
          </DialogTitle>
          <DialogDescription>
            Speak these commands to control the form
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {commands.map((cmd, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <code className="text-sm font-medium text-primary">{cmd.command}</code>
                <span className="text-sm text-muted-foreground">{cmd.action}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Main VoiceFormControl component
const VoiceFormControl = ({
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  onSubmit,
  totalSteps = 4,
  className = '',
  compact = false,
  showVisualization = true,
}) => {
  // State
  const [language, setLanguage] = useState(getPreferredLanguage());
  const [state, setState] = useState(RECOGNITION_STATES.IDLE);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [analyserNode, setAnalyserNode] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const controllerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Initialize form voice controller
  useEffect(() => {
    controllerRef.current = createFormVoiceController({
      formData,
      setFormData,
      currentStep,
      setCurrentStep,
      onSubmit,
      language,
      totalSteps,
      onFeedback: (fb) => {
        setFeedback({ message: fb.message, type: fb.success ? 'success' : 'error' });
        
        // Speak feedback if sound enabled
        if (soundEnabled && fb.message) {
          speakFormFeedback(fb.message, language);
          if (recognitionRef.current) {
            recognitionRef.current.setLastFeedback(fb.message);
          }
        }

        // Clear feedback after delay
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback({ message: '', type: '' });
        }, 4000);
      },
      onError: (err) => {
        setError(err);
        setTimeout(() => setError(null), 5000);
      },
    });
  }, [formData, currentStep, language, totalSteps, soundEnabled]);

  // Setup audio visualization
  const setupAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      setAnalyserNode(analyser);
    } catch (err) {
      console.error('Audio visualization setup failed:', err);
    }
  }, []);

  // Cleanup audio
  const cleanupAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
  }, []);

  // Handle voice result - CRITICAL: Process final transcripts
  const handleResult = useCallback((transcript, confidence) => {
    console.log('[VoiceFormControl] ========================================');
    console.log('[VoiceFormControl] Received FINAL transcript:', transcript);
    console.log('[VoiceFormControl] Confidence:', confidence);
    setInterimTranscript('');
    
    // Process the command using flexible matching
    const command = processCommand(transcript, language);
    console.log('[VoiceFormControl] Processed command result:', {
      type: command.type,
      value: command.value,
      confidence: command.confidence,
    });
    setLastCommand({ transcript, command, timestamp: Date.now() });

    // Handle special commands
    if (command.type === COMMAND_TYPES.HELP) {
      console.log('[VoiceFormControl] HELP command - showing help');
      setShowHelp(true);
      return;
    }

    if (command.type === COMMAND_TYPES.REPEAT && recognitionRef.current) {
      console.log('[VoiceFormControl] REPEAT command');
      const lastFeedback = recognitionRef.current.getLastFeedback();
      if (lastFeedback && soundEnabled) {
        speakFormFeedback(lastFeedback, language);
      }
      return;
    }

    if (command.type === COMMAND_TYPES.STOP_LISTENING) {
      console.log('[VoiceFormControl] STOP command');
      stopListening();
      return;
    }

    // Handle UNKNOWN command - DON'T show error, just log it
    if (command.type === COMMAND_TYPES.UNKNOWN) {
      console.log('[VoiceFormControl] UNKNOWN command - ignoring (not showing error)');
      console.log('[VoiceFormControl] Transcript was:', transcript);
      // DON'T show error to user - this might be partial speech or ambient noise
      return;
    }

    // Execute the recognized command through controller
    if (controllerRef.current) {
      console.log('[VoiceFormControl] Executing command via controller...');
      controllerRef.current.executeCommand(command);
      console.log('[VoiceFormControl] Command execution complete');
    } else {
      console.error('[VoiceFormControl] Controller not initialized!');
    }
    console.log('[VoiceFormControl] ========================================');
  }, [language, soundEnabled]);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.destroy();
    }

    recognitionRef.current = createFormSpeechRecognition({
      language,
      continuous: true,
      interimResults: true,
      autoRestart: true,
      onResult: handleResult,
      onInterim: setInterimTranscript,
      onStateChange: setState,
      onError: (err) => {
        console.log('[VoiceFormControl] Recognition error:', err);
        // Only show error for non-recoverable errors
        if (!err.recoverable) {
          setError(err.message);
          stopListening();
        }
        // Auto-clear error after delay
        setTimeout(() => setError(null), 5000);
      },
      onEnd: (reason) => {
        console.log('[VoiceFormControl] Recognition ended:', reason);
        if (reason === 'max_restarts_reached') {
          setFeedback({
            message: getFeedbackMessage('ERROR', language),
            type: 'error',
          });
        }
      },
    });
  }, [language, handleResult]);

  // Start listening
  const startListening = useCallback(async () => {
    // Initialize recognition if needed
    if (!recognitionRef.current) {
      initRecognition();
    }

    // Setup audio visualization
    if (showVisualization) {
      await setupAudioVisualization();
    }

    // Start recognition
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }

    // Announce start
    if (soundEnabled) {
      speakFormFeedback(getFeedbackMessage('LISTENING_STARTED', language), language);
    }
  }, [initRecognition, setupAudioVisualization, showVisualization, soundEnabled, language]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    cleanupAudio();
    setInterimTranscript('');

    // Announce stop
    if (soundEnabled) {
      speakFormFeedback(getFeedbackMessage('LISTENING_STOPPED', language), language);
    }
  }, [cleanupAudio, soundEnabled, language]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state === RECOGNITION_STATES.LISTENING) {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    setPreferredLanguage(newLanguage);

    // Re-initialize recognition with new language
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(newLanguage);
    }

    // Update controller language
    if (controllerRef.current) {
      controllerRef.current = createFormVoiceController({
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        onSubmit,
        language: newLanguage,
        totalSteps,
      });
    }

    // Announce language change
    if (soundEnabled) {
      const langName = SUPPORTED_LANGUAGES[newLanguage]?.nativeName || newLanguage;
      speakFormFeedback(`Language changed to ${langName}`, newLanguage);
    }
  }, [formData, setFormData, currentStep, setCurrentStep, onSubmit, totalSteps, soundEnabled]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        speakFormFeedback('Sound enabled', language);
      }
      return newValue;
    });
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.destroy();
      }
      cleanupAudio();
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [cleanupAudio]);

  // Derived state
  const isListening = state === RECOGNITION_STATES.LISTENING;
  const isPaused = state === RECOGNITION_STATES.PAUSED;
  const isError = state === RECOGNITION_STATES.ERROR;
  const stepHint = getStepHints(currentStep, language);

  // Compact mode render
  if (compact) {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MicButton
                  isListening={isListening}
                  isPaused={isPaused}
                  isError={isError}
                  onClick={toggleListening}
                  size="sm"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isListening ? 'Stop listening' : 'Start voice input'}
            </TooltipContent>
          </Tooltip>

          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
            disabled={isListening}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(true)}
                className="h-8 w-8"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice commands help</TooltipContent>
          </Tooltip>

          <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} language={language} />
        </div>
      </TooltipProvider>
    );
  }

  // Full mode render
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={isListening ? 'destructive' : 'secondary'} className="gap-1">
              {isListening ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Listening
                </>
              ) : isPaused ? (
                'Paused'
              ) : (
                'Voice Control'
              )}
            </Badge>

            {/* Current step indicator */}
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1}: {getStepName(currentStep, language)}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {/* Sound toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSound}
                    className="h-8 w-8"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {soundEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Help button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHelp(true)}
                    className="h-8 w-8"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice commands help</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Language selector */}
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              disabled={isListening}
            />
          </div>
        </div>

        {/* Main control area */}
        <div className="flex items-center justify-center gap-4 py-4">
          <MicButton
            isListening={isListening}
            isPaused={isPaused}
            isError={isError}
            onClick={toggleListening}
          />

          {/* Visualizer or transcript display */}
          <div className="flex-1 min-w-0">
            {isListening && showVisualization && analyserNode ? (
              <AudioVisualizer isListening={isListening} analyserNode={analyserNode} />
            ) : (
              <div className="text-sm text-muted-foreground truncate">
                {isListening ? (
                  interimTranscript || 'Listening...'
                ) : (
                  stepHint
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interim transcript display */}
        <AnimatePresence>
          {isListening && interimTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="p-2 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Hearing: </span>
                <span className="text-foreground italic">{interimTranscript}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback display */}
        <AnimatePresence>
          {feedback.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`
                p-3 rounded-lg text-sm flex items-center gap-2
                ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
              `}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last command display */}
        {lastCommand && !feedback.message && (
          <div className="mt-3 text-xs text-muted-foreground">
            Last heard: "{lastCommand.transcript}"
          </div>
        )}

        <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} language={language} />
      </CardContent>
    </Card>
  );
};

export default VoiceFormControl;
