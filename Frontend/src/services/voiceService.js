/**
 * Voice Service
 * Centralized voice recognition and text-to-speech functionality
 * Supports multilingual voice interaction with continuous listening mode
 */

// Supported languages with native names
export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English (US)', nativeName: 'English (US)', code: 'en-US', flag: '🇺🇸' },
  'en-GB': { name: 'English (UK)', nativeName: 'English (UK)', code: 'en-GB', flag: '🇬🇧' },
  'hi-IN': { name: 'Hindi', nativeName: 'हिंदी', code: 'hi-IN', flag: '🇮🇳' },
  'mr-IN': { name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', flag: '🇮🇳' },
};

// Recognition states
export const RECOGNITION_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  ERROR: 'ERROR',
  PAUSED: 'PAUSED',
};

// Voice command patterns for navigation
const NAVIGATION_COMMANDS = {
  'en-US': {
    home: ['go home', 'home page', 'main page', 'homepage'],
    dashboard: ['dashboard', 'admin dashboard', 'show dashboard', 'open dashboard'],
    submit: ['submit complaint', 'new complaint', 'file complaint', 'report issue', 'create complaint'],
    track: ['track complaint', 'my complaints', 'check status', 'complaint status'],
    services: ['services', 'show services', 'service page'],
    leaderboard: ['leaderboard', 'rankings', 'top users'],
    settings: ['settings', 'my settings', 'user settings', 'preferences'],
    logout: ['logout', 'sign out', 'log out'],
  },
  'hi-IN': {
    home: ['होम पेज', 'मुख्य पेज'],
    dashboard: ['डैशबोर्ड', 'प्रशासनिक डैशबोर्ड'],
    submit: ['शिकायत दर्ज करें', 'नई शिकायत', 'समस्या रिपोर्ट करें'],
    track: ['शिकायत ट्रैक करें', 'मेरी शिकायतें', 'स्थिति जांचें'],
    services: ['सेवाएं', 'सेवा पृष्ठ'],
    leaderboard: ['लीडरबोर्ड', 'रैंकिंग'],
    settings: ['सेटिंग्स', 'मेरी सेटिंग्स'],
    logout: ['लॉग आउट', 'साइन आउट'],
  }
};

/**
 * Check if speech recognition is supported
 */
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

/**
 * Check if text-to-speech is supported
 */
export const isTextToSpeechSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Get user's preferred language from browser or localStorage
 */
export const getPreferredLanguage = () => {
  const stored = localStorage.getItem('voice_language');
  if (stored && SUPPORTED_LANGUAGES[stored]) {
    return stored;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language || navigator.userLanguage;
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang;
  }
  
  // Default to English
  return 'en-US';
};

/**
 * Set preferred language
 */
export const setPreferredLanguage = (languageCode) => {
  if (SUPPORTED_LANGUAGES[languageCode]) {
    localStorage.setItem('voice_language', languageCode);
    return true;
  }
  return false;
};

/**
 * Parse voice command for navigation
 */
export const parseNavigationCommand = (transcript, language = 'en-US') => {
  if (!transcript) return null;
  
  const text = transcript.toLowerCase().trim();
  const commands = NAVIGATION_COMMANDS[language] || NAVIGATION_COMMANDS['en-US'];
  
  for (const [route, patterns] of Object.entries(commands)) {
    if (patterns.some(pattern => text.includes(pattern.toLowerCase()))) {
      return route;
    }
  }
  
  return null;
};

/**
 * Text-to-Speech service
 */
export class TextToSpeechService {
  constructor() {
    this.enabled = isTextToSpeechSupported();
    this.synth = this.enabled ? window.speechSynthesis : null;
    this.currentUtterance = null;
  }

  /**
   * Speak text with optional language
   */
  speak(text, options = {}) {
    if (!this.enabled || !text) return false;

    // Stop any ongoing speech
    this.stop();

    const {
      language = getPreferredLanguage(),
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      onEnd = null,
      onError = null,
    } = options;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (onEnd) {
        utterance.onend = onEnd;
      }

      if (onError) {
        utterance.onerror = onError;
      }

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      return false;
    }
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.enabled && this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause speaking
   */
  pause() {
    if (this.enabled && this.synth) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume() {
    if (this.enabled && this.synth) {
      this.synth.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.enabled && this.synth && this.synth.speaking;
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!this.enabled) return [];
    return this.synth.getVoices();
  }

  /**
   * Get voices for specific language
   */
  getVoicesForLanguage(language) {
    return this.getVoices().filter(voice => 
      voice.lang.startsWith(language.split('-')[0])
    );
  }
}

// Singleton instance
let ttsInstance = null;

export const getTTSService = () => {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeechService();
  }
  return ttsInstance;
};

/**
 * Speak complaint status update
 */
export const speakComplaintStatus = (status, complaintId, language = 'en-US') => {
  const tts = getTTSService();
  
  const messages = {
    'en-US': {
      pending: `Your complaint ${complaintId} is pending review`,
      'in-progress': `Your complaint ${complaintId} is currently being addressed`,
      resolved: `Good news! Your complaint ${complaintId} has been resolved`,
      rejected: `Your complaint ${complaintId} has been rejected`,
    },
    'hi-IN': {
      pending: `आपकी शिकायत ${complaintId} समीक्षा के लिए लंबित है`,
      'in-progress': `आपकी शिकायत ${complaintId} पर वर्तमान में काम चल रहा है`,
      resolved: `शुभ समाचार! आपकी शिकायत ${complaintId} का समाधान हो गया है`,
      rejected: `आपकी शिकायत ${complaintId} को अस्वीकार कर दिया गया है`,
    }
  };

  const langMessages = messages[language] || messages['en-US'];
  const message = langMessages[status] || `Status update for complaint ${complaintId}`;
  
  return tts.speak(message, { language });
};

/**
 * Speak navigation feedback
 */
export const speakNavigationFeedback = (route, language = 'en-US') => {
  const tts = getTTSService();
  
  const messages = {
    'en-US': {
      home: 'Navigating to home page',
      dashboard: 'Opening dashboard',
      submit: 'Opening complaint submission form',
      track: 'Opening complaint tracking',
      services: 'Opening services page',
      leaderboard: 'Opening leaderboard',
      settings: 'Opening settings',
      logout: 'Logging out',
    },
    'hi-IN': {
      home: 'होम पेज पर जा रहे हैं',
      dashboard: 'डैशबोर्ड खोल रहे हैं',
      submit: 'शिकायत फॉर्म खोल रहे हैं',
      track: 'शिकायत ट्रैकिंग खोल रहे हैं',
      services: 'सेवा पृष्ठ खोल रहे हैं',
      leaderboard: 'लीडरबोर्ड खोल रहे हैं',
      settings: 'सेटिंग्स खोल रहे हैं',
      logout: 'लॉग आउट हो रहा है',
    }
  };

  const langMessages = messages[language] || messages['en-US'];
  const message = langMessages[route] || `Navigating to ${route}`;
  
  return tts.speak(message, { language, rate: 1.1 });
};

/**
 * Speak error message
 */
export const speakError = (errorType, language = 'en-US') => {
  const tts = getTTSService();
  
  const messages = {
    'en-US': {
      'no-command': 'Sorry, I did not understand that command',
      'not-allowed': 'Microphone access is required for voice commands',
      'network': 'Network error. Please check your connection',
      'no-speech': 'No speech detected. Please try again',
    },
    'hi-IN': {
      'no-command': 'क्षमा करें, मुझे वह कमांड समझ नहीं आई',
      'not-allowed': 'वॉइस कमांड के लिए माइक्रोफोन एक्सेस आवश्यक है',
      'network': 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें',
      'no-speech': 'कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें',
    }
  };

  const langMessages = messages[language] || messages['en-US'];
  const message = langMessages[errorType] || 'An error occurred';
  
  return tts.speak(message, { language });
};

/**
 * Announce page title for accessibility
 */
export const announcePageTitle = (title, language = 'en-US') => {
  const tts = getTTSService();
  return tts.speak(title, { language, rate: 1.2 });
};

/**
 * Form Speech Recognition Service
 * Enhanced speech recognition for form filling with continuous listening
 */
export class FormSpeechRecognitionService {
  constructor(options = {}) {
    this.isSupported = isSpeechRecognitionSupported();
    this.recognition = null;
    this.state = RECOGNITION_STATES.IDLE;
    this.language = options.language || getPreferredLanguage();
    // IMPORTANT: continuous = true for ongoing listening
    this.continuous = options.continuous !== false;
    // IMPORTANT: interimResults = false to only get FINAL transcripts
    // This prevents partial/incomplete text from being processed
    this.interimResults = options.interimResults === true; // Default to FALSE now
    this.maxAlternatives = options.maxAlternatives || 1;
    
    // Callbacks
    this.onResult = options.onResult || null;
    this.onInterim = options.onInterim || null;
    this.onStateChange = options.onStateChange || null;
    this.onError = options.onError || null;
    this.onEnd = options.onEnd || null;
    
    // Auto-restart settings
    this.autoRestart = options.autoRestart !== false;
    this.restartDelay = options.restartDelay || 300;
    this.maxRestarts = options.maxRestarts || 20; // Increased for better reliability
    this.restartCount = 0;
    this.restartTimeout = null;
    
    // Silence detection
    this.silenceTimeout = null;
    this.silenceDelay = options.silenceDelay || 5000; // Increased to 5 seconds
    
    // Last transcript for repeat functionality
    this.lastTranscript = '';
    this.lastFeedback = '';
    
    console.log('[SpeechRecognition] Initializing with options:', {
      language: this.language,
      continuous: this.continuous,
      interimResults: this.interimResults,
      autoRestart: this.autoRestart,
    });
    
    if (this.isSupported) {
      this._initRecognition();
    } else {
      console.warn('[SpeechRecognition] Web Speech API not supported in this browser');
    }
  }

  /**
   * Initialize the speech recognition instance
   */
  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.maxAlternatives = this.maxAlternatives;
    this.recognition.lang = this.language;
    
    console.log('[SpeechRecognition] Recognition configured:', {
      continuous: this.recognition.continuous,
      interimResults: this.recognition.interimResults,
      lang: this.recognition.lang,
    });

    // Handle results - CRITICAL: Always get the FINAL result
    this.recognition.onresult = (event) => {
      this._clearSilenceTimeout();
      
      // Get the LAST/FINAL result from the event
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.8;
      
      console.log('[SpeechRecognition] Result received:', {
        resultIndex: lastResultIndex,
        isFinal: result.isFinal,
        transcript: transcript,
        confidence: confidence,
      });
      
      // Only process FINAL results
      if (result.isFinal) {
        console.log('[SpeechRecognition] FINAL transcript:', transcript);
        this.lastTranscript = transcript;
        
        if (this.onResult) {
          this.onResult(transcript, confidence);
        }
      } else if (this.interimResults && this.onInterim) {
        // Only call interim callback if interim results are enabled
        this.onInterim(transcript);
      }

      // Reset silence detection
      this._startSilenceTimeout();
    };

    // Handle speech start
    this.recognition.onspeechstart = () => {
      this._clearSilenceTimeout();
      this._setState(RECOGNITION_STATES.LISTENING);
    };

    // Handle speech end
    this.recognition.onspeechend = () => {
      this._startSilenceTimeout();
    };

    // Handle end
    this.recognition.onend = () => {
      this._clearSilenceTimeout();
      
      // Auto-restart if enabled and not manually stopped
      if (this.autoRestart && this.state === RECOGNITION_STATES.LISTENING) {
        if (this.restartCount < this.maxRestarts) {
          this.restartCount++;
          this.restartTimeout = setTimeout(() => {
            if (this.state !== RECOGNITION_STATES.IDLE) {
              this._startRecognition();
            }
          }, this.restartDelay);
        } else {
          this._setState(RECOGNITION_STATES.IDLE);
          if (this.onEnd) {
            this.onEnd('max_restarts_reached');
          }
        }
      } else {
        this._setState(RECOGNITION_STATES.IDLE);
        if (this.onEnd) {
          this.onEnd('stopped');
        }
      }
    };

    // Handle errors - CRITICAL: Handle gracefully without disrupting user
    this.recognition.onerror = (event) => {
      console.log('[SpeechRecognition] Error event:', event.error);
      this._clearSilenceTimeout();
      
      const errorInfo = this._parseError(event.error);
      
      // These errors are common and should NOT interrupt the user
      // Just silently recover and continue listening
      if (['no-speech', 'aborted'].includes(event.error)) {
        console.log('[SpeechRecognition] Recoverable error (no-speech/aborted), silently continuing...');
        // Reset restart count for recoverable errors
        this.restartCount = Math.max(0, this.restartCount - 1);
        return;
      }
      
      // Network errors are usually temporary - handle gracefully
      if (event.error === 'network') {
        console.log('[SpeechRecognition] Network error - will auto-retry');
        errorInfo.message = 'Voice service temporarily unavailable. Retrying...';
        errorInfo.recoverable = true;
        // Don't show error for network issues, just silently retry
        return;
      }
      
      // Audio capture errors - might be temporary
      if (event.error === 'audio-capture') {
        console.log('[SpeechRecognition] Audio capture error - checking microphone');
        errorInfo.recoverable = true;
      }
      
      // Only change state to ERROR for truly non-recoverable errors
      if (!errorInfo.recoverable) {
        console.log('[SpeechRecognition] Non-recoverable error:', event.error);
        this._setState(RECOGNITION_STATES.ERROR);
      }
      
      // Only notify user for non-recoverable errors
      if (this.onError && !errorInfo.recoverable) {
        this.onError(errorInfo);
      }
    };
  }

  /**
   * Parse error code into user-friendly message
   */
  _parseError(errorCode) {
    const errorMessages = {
      'not-allowed': {
        code: 'not-allowed',
        message: 'Microphone access denied',
        recoverable: false,
      },
      'no-speech': {
        code: 'no-speech',
        message: 'No speech detected',
        recoverable: true,
      },
      'audio-capture': {
        code: 'audio-capture',
        message: 'No microphone found',
        recoverable: false,
      },
      'network': {
        code: 'network',
        message: 'Network error',
        recoverable: true,
      },
      'aborted': {
        code: 'aborted',
        message: 'Recognition aborted',
        recoverable: true,
      },
      'service-not-allowed': {
        code: 'service-not-allowed',
        message: 'Service not allowed',
        recoverable: false,
      },
    };

    return errorMessages[errorCode] || {
      code: errorCode,
      message: 'Unknown error',
      recoverable: false,
    };
  }

  /**
   * Set state and notify listeners
   */
  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    if (this.onStateChange && oldState !== newState) {
      this.onStateChange(newState, oldState);
    }
  }

  /**
   * Start silence detection timeout
   */
  _startSilenceTimeout() {
    this._clearSilenceTimeout();
    
    if (this.silenceDelay > 0) {
      this.silenceTimeout = setTimeout(() => {
        // On silence, we don't stop, just let the recognition handle it
      }, this.silenceDelay);
    }
  }

  /**
   * Clear silence detection timeout
   */
  _clearSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  /**
   * Internal start recognition
   */
  _startRecognition() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition might already be started
        if (e.name !== 'InvalidStateError') {
          throw e;
        }
      }
    }
  }

  /**
   * Start listening
   */
  start() {
    if (!this.isSupported) {
      if (this.onError) {
        this.onError({
          code: 'not-supported',
          message: 'Speech recognition not supported in this browser',
          recoverable: false,
        });
      }
      return false;
    }

    if (this.state === RECOGNITION_STATES.LISTENING) {
      return true; // Already listening
    }

    this.restartCount = 0;
    this._setState(RECOGNITION_STATES.LISTENING);
    this._startRecognition();
    return true;
  }

  /**
   * Stop listening
   */
  stop() {
    this._clearSilenceTimeout();
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      this.autoRestart = false; // Prevent auto-restart
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    this._setState(RECOGNITION_STATES.IDLE);
  }

  /**
   * Pause listening (stop but remember state)
   */
  pause() {
    if (this.state === RECOGNITION_STATES.LISTENING) {
      this._clearSilenceTimeout();
      
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }

      const wasAutoRestart = this.autoRestart;
      this.autoRestart = false;
      
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }

      this.autoRestart = wasAutoRestart;
      this._setState(RECOGNITION_STATES.PAUSED);
    }
  }

  /**
   * Resume listening after pause
   */
  resume() {
    if (this.state === RECOGNITION_STATES.PAUSED) {
      this.start();
    }
  }

  /**
   * Change language
   */
  setLanguage(languageCode) {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      this.language = languageCode;
      if (this.recognition) {
        this.recognition.lang = languageCode;
      }
      setPreferredLanguage(languageCode);
      return true;
    }
    return false;
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.language;
  }

  /**
   * Get last transcript (for repeat functionality)
   */
  getLastTranscript() {
    return this.lastTranscript;
  }

  /**
   * Set last feedback (for repeat functionality)
   */
  setLastFeedback(feedback) {
    this.lastFeedback = feedback;
  }

  /**
   * Get last feedback
   */
  getLastFeedback() {
    return this.lastFeedback;
  }

  /**
   * Check if currently listening
   */
  isListening() {
    return this.state === RECOGNITION_STATES.LISTENING;
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    this.onResult = null;
    this.onInterim = null;
    this.onStateChange = null;
    this.onError = null;
    this.onEnd = null;
    this.recognition = null;
  }
}

/**
 * Create a form speech recognition instance
 */
export const createFormSpeechRecognition = (options = {}) => {
  return new FormSpeechRecognitionService(options);
};

/**
 * Speak form feedback with appropriate language
 */
export const speakFormFeedback = (message, language = 'en-US', options = {}) => {
  const tts = getTTSService();
  return tts.speak(message, { 
    language, 
    rate: options.rate || 1.0,
    ...options 
  });
};
