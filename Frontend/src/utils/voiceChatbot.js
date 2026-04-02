/**
 * Voice Service for AI Chatbot
 * Web Speech API wrapper with multilingual support
 */

// Check if browser supports Web Speech API
export const isSpeechSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const isSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Language mapping for speech recognition
const SPEECH_LANG_MAP = {
  'en-US': 'en-US',
  'hi-IN': 'hi-IN',
  'mr-IN': 'mr-IN'
};

// Language mapping for speech synthesis
const SYNTHESIS_LANG_MAP = {
  'en-US': 'en-US',
  'hi-IN': 'hi-IN',
  'mr-IN': 'mr-IN'
};

/**
 * Speech Recognition Class
 */
export class VoiceRecognizer {
  constructor(language = 'en-US') {
    if (!isSpeechSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = SPEECH_LANG_MAP[language] || 'en-US';
    
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
    
    this.setupListeners();
  }
  
  setupListeners() {
    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (this.onResult) {
        this.onResult({
          final: finalTranscript,
          interim: interimTranscript,
          isFinal: event.results[event.results.length - 1]?.isFinal || false
        });
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };
    
    this.recognition.onend = () => {
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }
  
  start() {
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      return false;
    }
  }
  
  stop() {
    try {
      this.recognition.stop();
      return true;
    } catch (error) {
      console.error('Failed to stop recognition:', error);
      return false;
    }
  }
  
  abort() {
    try {
      this.recognition.abort();
      return true;
    } catch (error) {
      console.error('Failed to abort recognition:', error);
      return false;
    }
  }
  
  setLanguage(language) {
    this.recognition.lang = SPEECH_LANG_MAP[language] || 'en-US';
  }
}

/**
 * Speech Synthesis Class
 */
export class VoiceSynthesizer {
  constructor() {
    if (!isSynthesisSupported()) {
      throw new Error('Speech synthesis not supported in this browser');
    }
    
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.onStart = null;
    this.onEnd = null;
    this.onError = null;
  }
  
  /**
   * Speak text in specified language
   * @param {string} text - Text to speak
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>}
   */
  speak(text, language = 'en-US', options = {}) {
    return new Promise((resolve) => {
      if (!text || !this.synthesis) {
        resolve(false);
        return;
      }
      
      // Cancel any ongoing speech
      this.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SYNTHESIS_LANG_MAP[language] || 'en-US';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      // Try to find appropriate voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes(language) || v.lang.includes(language.split('-')[0])
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        this.currentUtterance = utterance;
        if (this.onStart) this.onStart();
      };
      
      utterance.onend = () => {
        this.currentUtterance = null;
        if (this.onEnd) this.onEnd();
        resolve(true);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.currentUtterance = null;
        if (this.onError) this.onError(event);
        resolve(false);
      };
      
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * Stop speaking
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }
  
  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.synthesis ? this.synthesis.speaking : false;
  }
  
  /**
   * Get available voices
   */
  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
  
  /**
   * Preload voices (call this early to ensure voices are loaded)
   */
  preloadVoices() {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve([]);
        return;
      }
      
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      
      // Wait for voices to load
      this.synthesis.onvoiceschanged = () => {
        resolve(this.synthesis.getVoices());
      };
      
      // Timeout after 3 seconds
      setTimeout(() => {
        resolve(this.synthesis.getVoices());
      }, 3000);
    });
  }
}

/**
 * Multilingual response messages
 */
export const RESPONSE_MESSAGES = {
  'en-US': {
    greeting: "Hello! I'm your Municipal Assistant. How can I help you today?",
    help: "You can say: 'Submit a complaint about street light' or 'Track my complaint'. What would you like to do?",
    notUnderstood: "Sorry, I didn't understand. Please try again or say 'help' for assistance.",
    submitPrompt: "Please tell me what type of complaint you'd like to submit. For example: street light, road, garbage, or water issue.",
    trackPrompt: "Please provide your complaint ID or say 'show all my complaints'.",
    processing: "Processing your request...",
    navigating: "Navigating to the form...",
    cameraOpening: "Opening camera for photo capture...",
    success: "Your complaint has been submitted successfully!",
    confirmSubmit: "I'll help you submit a complaint about {category}. Opening the form now.",
    confirmTrack: "Let me help you track your complaint.",
    noCategory: "What type of complaint would you like to submit? Please specify: street light, road, garbage, water, or other."
  },
  'hi-IN': {
    greeting: "नमस्ते! मैं आपका नगरपालिका सहायक हूं। मैं आपकी क्या मदद कर सकता हूं?",
    help: "आप कह सकते हैं: 'स्ट्रीट लाइट की शिकायत दर्ज करें' या 'मेरी शिकायत ट्रैक करें'। आप क्या करना चाहेंगे?",
    notUnderstood: "क्षमा करें, मुझे समझ नहीं आया। कृपया फिर से प्रयास करें या सहायता के लिए 'मदद' कहें।",
    submitPrompt: "कृपया मुझे बताएं कि आप किस प्रकार की शिकायत दर्ज करना चाहते हैं। उदाहरण के लिए: स्ट्रीट लाइट, सड़क, कचरा, या पानी की समस्या।",
    trackPrompt: "कृपया अपनी शिकायत आईडी प्रदान करें या 'मेरी सभी शिकायतें दिखाएं' कहें।",
    processing: "आपका अनुरोध प्रोसेस किया जा रहा है...",
    navigating: "फॉर्म पर ले जाया जा रहा है...",
    cameraOpening: "फोटो कैप्चर के लिए कैमरा खोला जा रहा है...",
    success: "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है!",
    confirmSubmit: "मैं {category} के बारे में शिकायत दर्ज करने में आपकी मदद करूंगा। फॉर्म खोला जा रहा है।",
    confirmTrack: "मैं आपकी शिकायत ट्रैक करने में आपकी मदद करता हूं।",
    noCategory: "आप किस प्रकार की शिकायत दर्ज करना चाहते हैं? कृपया बताएं: स्ट्रीट लाइट, सड़क, कचरा, पानी, या अन्य।"
  },
  'mr-IN': {
    greeting: "नमस्कार! मी तुमचा महानगरपालिका सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
    help: "तुम्ही म्हणू शकता: 'स्ट्रीट लाइटची तक्रार दाखल करा' किंवा 'माझी तक्रार ट्रॅक करा'. तुम्हाला काय करायचे आहे?",
    notUnderstood: "क्षमस्व, मला समजले नाही. कृपया पुन्हा प्रयत्न करा किंवा सहाय्यासाठी 'मदत' म्हणा.",
    submitPrompt: "कृपया मला सांगा की तुम्हाला कोणत्या प्रकारची तक्रार दाखल करायची आहे. उदाहरणार्थ: स्ट्रीट लाइट, रस्ता, कचरा, किंवा पाण्याची समस्या.",
    trackPrompt: "कृपया तुमची तक्रार आयडी द्या किंवा 'माझ्या सर्व तक्रारी दाखवा' म्हणा.",
    processing: "तुमची विनंती प्रक्रिया केली जात आहे...",
    navigating: "फॉर्मवर नेण्यात येत आहे...",
    cameraOpening: "फोटो कॅप्चरसाठी कॅमेरा उघडला जात आहे...",
    success: "तुमची तक्रार यशस्वीरित्या दाखल झाली आहे!",
    confirmSubmit: "मी {category} बद्दल तक्रार दाखल करण्यात तुमची मदत करेन. फॉर्म उघडला जात आहे.",
    confirmTrack: "मी तुमची तक्रार ट्रॅक करण्यात तुमची मदत करतो.",
    noCategory: "तुम्हाला कोणत्या प्रकारची तक्रार दाखल करायची आहे? कृपया सांगा: स्ट्रीट लाइट, रस्ता, कचरा, पाणी, किंवा इतर."
  }
};

/**
 * Get response message in specified language
 * @param {string} key - Message key
 * @param {string} language - Language code
 * @param {Object} params - Parameters for interpolation
 * @returns {string}
 */
export const getResponseMessage = (key, language = 'en-US', params = {}) => {
  const messages = RESPONSE_MESSAGES[language] || RESPONSE_MESSAGES['en-US'];
  let message = messages[key] || messages.notUnderstood;
  
  // Simple parameter interpolation
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  
  return message;
};

/**
 * Camera helper functions
 */
export const CameraHelper = {
  /**
   * Request camera permission and get stream
   * @returns {Promise<MediaStream>}
   */
  async getCameraStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      throw new Error('Could not access camera. Please check permissions.');
    }
  },
  
  /**
   * Capture image from video stream
   * @param {HTMLVideoElement} videoElement
   * @returns {string} Base64 image data
   */
  captureImage(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  },
  
  /**
   * Stop camera stream
   * @param {MediaStream} stream
   */
  stopStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
};

// Export singleton instance
export const voiceSynthesizer = new VoiceSynthesizer();

export default {
  isSpeechSupported,
  isSynthesisSupported,
  VoiceRecognizer,
  VoiceSynthesizer,
  voiceSynthesizer,
  RESPONSE_MESSAGES,
  getResponseMessage,
  CameraHelper
};
