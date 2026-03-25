import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Recording states
const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  ERROR: 'error',
};

// Waveform visualization component
const AudioWaveform = ({ isRecording, analyser }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyser]);

  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 40 }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full overflow-hidden rounded-lg bg-muted/50"
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={40}
        className="w-full h-10"
      />
    </motion.div>
  );
};

// Animated microphone icon
const AnimatedMicIcon = ({ state }) => {
  const isListening = state === STATES.LISTENING;
  const isProcessing = state === STATES.PROCESSING;
  const isError = state === STATES.ERROR;

  if (isProcessing) {
    return <Loader2 className="w-5 h-5 animate-spin" />;
  }

  if (isError) {
    return <AlertCircle className="w-5 h-5 text-destructive" />;
  }

  return (
    <div className="relative">
      {isListening ? (
        <Mic className="w-5 h-5" />
      ) : (
        <MicOff className="w-5 h-5 text-muted-foreground" />
      )}
      
      {/* Pulse animation when listening */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-destructive"
            />
            <motion.span
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-destructive"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const VoiceInput = ({ 
  onTranscript, 
  onPartialTranscript,
  placeholder = "Click to speak...",
  className = "",
  buttonOnly = false,
  size = "default"
}) => {
  const [state, setState] = useState(STATES.IDLE);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [analyser, setAnalyser] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Check for Web Speech API support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const setupAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 64;
      source.connect(analyserNode);
      
      setAnalyser(analyserNode);
    } catch (err) {
      console.error('Error setting up audio analyser:', err);
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyser(null);
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Voice input is not supported in your browser');
      setState(STATES.ERROR);
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      await setupAudioAnalyser();
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState(STATES.LISTENING);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript(prev => prev + final);
          onTranscript?.(transcript + final);
        }
        
        setInterimTranscript(interim);
        onPartialTranscript?.(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'An error occurred';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Recording was aborted.';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        
        setError(errorMessage);
        setState(STATES.ERROR);
        cleanupAudio();
      };

      recognition.onend = () => {
        if (state === STATES.LISTENING) {
          setState(STATES.PROCESSING);
          // Finalize transcript
          const finalTranscript = transcript + interimTranscript;
          if (finalTranscript) {
            onTranscript?.(finalTranscript);
          }
          setInterimTranscript('');
          cleanupAudio();
          
          // Brief processing state then back to idle
          setTimeout(() => setState(STATES.IDLE), 300);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start voice input. Please try again.');
      setState(STATES.ERROR);
      cleanupAudio();
    }
  }, [isSupported, setupAudioAnalyser, cleanupAudio, onTranscript, onPartialTranscript, transcript, interimTranscript, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    cleanupAudio();
  }, [cleanupAudio]);

  const toggleListening = useCallback(() => {
    if (state === STATES.LISTENING) {
      stopListening();
    } else if (state === STATES.IDLE || state === STATES.ERROR) {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (state === STATES.ERROR) {
      const timer = setTimeout(() => {
        setState(STATES.IDLE);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const isListening = state === STATES.LISTENING;
  const isProcessing = state === STATES.PROCESSING;
  const isError = state === STATES.ERROR;

  const buttonSizes = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };

  // Button-only mode for compact usage
  if (buttonOnly) {
    return (
      <motion.div className="relative inline-flex">
        <Button
          type="button"
          variant={isListening ? "destructive" : isError ? "destructive" : "outline"}
          size="icon"
          onClick={toggleListening}
          disabled={isProcessing || !isSupported}
          className={`${buttonSizes[size]} relative ${className}`}
          title={isSupported ? (isListening ? "Stop recording" : "Start voice input") : "Voice input not supported"}
        >
          <AnimatedMicIcon state={state} />
        </Button>
        
        {/* Recording indicator ring */}
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
      </motion.div>
    );
  }

  // Full voice input component with waveform
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : isError ? "destructive" : "outline"}
          size="icon"
          onClick={toggleListening}
          disabled={isProcessing || !isSupported}
          className={`${buttonSizes[size]} relative shrink-0`}
          title={isSupported ? (isListening ? "Stop recording" : "Start voice input") : "Voice input not supported"}
        >
          <AnimatedMicIcon state={state} />
        </Button>
        
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {isListening && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm font-medium text-destructive"
                >
                  Listening...
                </motion.span>
                <span className="text-xs text-muted-foreground">
                  {interimTranscript || "Speak now"}
                </span>
              </motion.div>
            )}
            
            {isProcessing && (
              <motion.span
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Processing...
              </motion.span>
            )}
            
            {isError && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.span>
            )}
            
            {state === STATES.IDLE && !isSupported && (
              <motion.span
                key="unsupported"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground"
              >
                Voice input not supported in this browser
              </motion.span>
            )}
            
            {state === STATES.IDLE && isSupported && (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                {placeholder}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Waveform visualization */}
      <AnimatePresence>
        {isListening && (
          <AudioWaveform isRecording={isListening} analyser={analyser} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
