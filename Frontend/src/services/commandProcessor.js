/**
 * Command Processor for Voice-Controlled Form System
 * Handles multi-language intent detection and command parsing
 * Supports: English (US/UK), Hindi, Marathi
 */

// Supported languages configuration
export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English (US)', nativeName: 'English (US)', code: 'en-US' },
  'en-GB': { name: 'English (UK)', nativeName: 'English (UK)', code: 'en-GB' },
  'hi-IN': { name: 'Hindi', nativeName: 'हिंदी', code: 'hi-IN' },
  'mr-IN': { name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN' },
};

// Command types for form control
export const COMMAND_TYPES = {
  FILL_NAME: 'FILL_NAME',
  FILL_EMAIL: 'FILL_EMAIL',
  FILL_PHONE: 'FILL_PHONE',
  FILL_TITLE: 'FILL_TITLE',
  FILL_DESCRIPTION: 'FILL_DESCRIPTION',
  FILL_ADDRESS: 'FILL_ADDRESS',
  SELECT_CATEGORY: 'SELECT_CATEGORY',
  SELECT_WARD: 'SELECT_WARD',
  NEXT_STEP: 'NEXT_STEP',
  PREVIOUS_STEP: 'PREVIOUS_STEP',
  GO_TO_STEP: 'GO_TO_STEP',
  SUBMIT_FORM: 'SUBMIT_FORM',
  CLEAR_FIELD: 'CLEAR_FIELD',
  REPEAT: 'REPEAT',
  HELP: 'HELP',
  STOP_LISTENING: 'STOP_LISTENING',
  UNKNOWN: 'UNKNOWN',
};

// Multi-language command patterns
const COMMAND_PATTERNS = {
  // English patterns
  'en-US': {
    FILL_NAME: [
      /(?:my\s+)?name\s+is\s+(.+)/i,
      /(?:i\s+am|i'm)\s+(.+)/i,
      /(?:call\s+me|set\s+name\s+(?:to|as)?)\s+(.+)/i,
      /full\s+name\s+(?:is\s+)?(.+)/i,
    ],
    FILL_EMAIL: [
      /(?:my\s+)?email\s+(?:is|address\s+is)?\s*(.+)/i,
      /(?:e-?mail|mail)\s+(?:id\s+)?(?:is\s+)?(.+)/i,
      /set\s+email\s+(?:to|as)?\s*(.+)/i,
    ],
    FILL_PHONE: [
      /(?:my\s+)?(?:phone|mobile|contact)\s*(?:number)?\s*(?:is)?\s*(.+)/i,
      /(?:call\s+me\s+(?:at|on)|reach\s+me\s+at)\s*(.+)/i,
      /set\s+phone\s+(?:to|as)?\s*(.+)/i,
    ],
    FILL_TITLE: [
      /(?:complaint\s+)?title\s+(?:is\s+)?(.+)/i,
      /(?:issue|problem)\s+(?:is\s+)?(?:about\s+)?(.+)/i,
      /set\s+title\s+(?:to|as)?\s*(.+)/i,
      /subject\s+(?:is\s+)?(.+)/i,
    ],
    FILL_DESCRIPTION: [
      /(?:complaint\s+)?description\s+(?:is\s+)?(.+)/i,
      /(?:details?\s+(?:is|are)\s+)?(.+)/i,
      /(?:the\s+)?problem\s+(?:is\s+)?(.+)/i,
      /set\s+description\s+(?:to|as)?\s*(.+)/i,
      /(?:i\s+want\s+to\s+(?:report|say|complain)\s+(?:that\s+)?)(.+)/i,
    ],
    FILL_ADDRESS: [
      /(?:my\s+)?(?:address|location)\s+(?:is\s+)?(.+)/i,
      /(?:i\s+(?:live|am)\s+(?:at|in|near))\s+(.+)/i,
      /set\s+(?:address|location)\s+(?:to|as)?\s*(.+)/i,
      /(?:the\s+)?(?:place|area|locality)\s+(?:is\s+)?(.+)/i,
    ],
    SELECT_CATEGORY: [
      /(?:select\s+)?category\s+(?:is\s+)?(.+)/i,
      /(?:it's\s+(?:about|related\s+to)|this\s+is\s+(?:about|for))\s+(.+)/i,
      /(?:service\s+)?type\s+(?:is\s+)?(.+)/i,
      /(?:set|choose)\s+category\s+(?:to|as)?\s*(.+)/i,
    ],
    SELECT_WARD: [
      /(?:select\s+)?ward\s+(?:is\s+|number\s+)?(.+)/i,
      /(?:i\s+(?:live|am)\s+in\s+)?ward\s*(.+)/i,
      /(?:set|choose)\s+ward\s+(?:to|as)?\s*(.+)/i,
    ],
    NEXT_STEP: [
      /^(?:next|go\s+(?:to\s+)?next|continue|proceed|forward|move\s+(?:to\s+)?next)(?:\s+step)?$/i,
      /^(?:next\s+page|move\s+forward)$/i,
    ],
    PREVIOUS_STEP: [
      /^(?:back|go\s+back|previous|return|backward)(?:\s+step)?$/i,
      /^(?:previous\s+page|move\s+back(?:ward)?)$/i,
    ],
    GO_TO_STEP: [
      /(?:go\s+to|jump\s+to|open)\s+(?:step\s+)?(\d+|one|two|three|four|first|second|third|fourth|last)/i,
      /(?:go\s+to|open)\s+(personal\s+info|issue\s+details?|location|media|review)/i,
    ],
    SUBMIT_FORM: [
      /^(?:submit|send|finish|complete|done)(?:\s+(?:complaint|form|it))?$/i,
      /^(?:submit\s+complaint|file\s+complaint|send\s+it)$/i,
    ],
    CLEAR_FIELD: [
      /(?:clear|delete|remove|erase)\s+(?:the\s+)?(name|email|phone|title|description|address|category|ward)/i,
      /(?:clear|delete|remove|erase)\s+(?:the\s+)?(?:current\s+)?field/i,
    ],
    REPEAT: [
      /^(?:repeat|say\s+(?:that\s+)?again|what\s+(?:did\s+you\s+say|was\s+that))$/i,
      /^(?:pardon|sorry|come\s+again)$/i,
    ],
    HELP: [
      /^(?:help|what\s+can\s+(?:i|you)\s+(?:say|do)|commands?|options?)$/i,
      /^(?:show\s+)?(?:available\s+)?commands?$/i,
    ],
    STOP_LISTENING: [
      /^(?:stop|pause|cancel|quit)(?:\s+listening)?$/i,
      /^(?:stop\s+voice|turn\s+off\s+(?:voice|mic(?:rophone)?))$/i,
    ],
  },

  // Hindi patterns
  'hi-IN': {
    FILL_NAME: [
      /(?:मेरा\s+)?नाम\s+(.+?)(?:\s+है)?$/i,
      /मुझे\s+(.+?)\s+(?:बुलाओ|कहो)/i,
    ],
    FILL_EMAIL: [
      /(?:मेरा\s+)?(?:ईमेल|इमेल|मेल)\s+(?:है\s+)?(.+)/i,
      /(?:ईमेल|इमेल)\s+(?:आईडी\s+)?(.+)/i,
    ],
    FILL_PHONE: [
      /(?:मेरा\s+)?(?:फोन|मोबाइल|नंबर)\s+(?:है\s+)?(.+)/i,
      /(?:फोन|मोबाइल)\s+नंबर\s+(.+)/i,
    ],
    FILL_TITLE: [
      /(?:शिकायत\s+का\s+)?(?:शीर्षक|टाइटल)\s+(?:है\s+)?(.+)/i,
      /(?:समस्या|मुद्दा)\s+(?:है\s+)?(.+)/i,
    ],
    FILL_DESCRIPTION: [
      /(?:शिकायत\s+का\s+)?(?:विवरण|ब्यौरा)\s+(?:है\s+)?(.+)/i,
      /(?:मैं\s+)?(?:बताना|कहना)\s+(?:चाहता|चाहती)\s+(?:हूं\s+(?:कि\s+)?)?(.+)/i,
      /(?:समस्या\s+)?(?:यह\s+है\s+(?:कि\s+)?)?(.+)/i,
    ],
    FILL_ADDRESS: [
      /(?:मेरा\s+)?(?:पता|ठिकाना|स्थान)\s+(?:है\s+)?(.+)/i,
      /(?:मैं\s+)?(?:रहता|रहती)\s+(?:हूं\s+)?(.+)/i,
    ],
    SELECT_CATEGORY: [
      /(?:श्रेणी|कैटेगरी)\s+(?:है\s+)?(.+)/i,
      /(?:यह\s+)?(.+?)\s+(?:के\s+बारे\s+में|से\s+संबंधित)\s+है/i,
    ],
    SELECT_WARD: [
      /वार्ड\s+(?:नंबर\s+)?(.+)/i,
      /(?:मैं\s+)?वार्ड\s+(.+?)\s+में\s+(?:रहता|रहती)/i,
    ],
    NEXT_STEP: [
      /^(?:आगे|अगला|जारी\s+रखो|आगे\s+(?:जाओ|बढ़ो))$/i,
      /^(?:अगला\s+(?:कदम|पेज|स्टेप))$/i,
    ],
    PREVIOUS_STEP: [
      /^(?:पीछे|वापस|पिछला)(?:\s+जाओ)?$/i,
      /^(?:पिछला\s+(?:कदम|पेज|स्टेप))$/i,
    ],
    GO_TO_STEP: [
      /(?:चरण|स्टेप)\s+(?:नंबर\s+)?(\d+|एक|दो|तीन|चार)\s+(?:पर\s+)?(?:जाओ)?/i,
    ],
    SUBMIT_FORM: [
      /^(?:सबमिट|जमा)\s+(?:करो|कर\s+दो)$/i,
      /^(?:शिकायत\s+)?(?:भेजो|भेज\s+दो|दर्ज\s+करो)$/i,
    ],
    CLEAR_FIELD: [
      /(?:मिटाओ|हटाओ|साफ\s+करो)\s+(.+)/i,
    ],
    REPEAT: [
      /^(?:दोहराओ|फिर\s+से\s+बोलो|क्या\s+बोला)$/i,
    ],
    HELP: [
      /^(?:मदद|सहायता|क्या\s+बोल\s+सकता\s+हूं)$/i,
    ],
    STOP_LISTENING: [
      /^(?:रुको|बंद\s+करो|सुनना\s+बंद\s+करो)$/i,
    ],
  },

  // Marathi patterns
  'mr-IN': {
    FILL_NAME: [
      /(?:माझ(?:ं|े)\s+)?नाव\s+(.+?)(?:\s+आहे)?$/i,
      /मला\s+(.+?)\s+(?:म्हणतात|बोलवा)/i,
    ],
    FILL_EMAIL: [
      /(?:माझ(?:ं|ा)\s+)?(?:ईमेल|इमेल|मेल)\s+(?:आहे\s+)?(.+)/i,
    ],
    FILL_PHONE: [
      /(?:माझा\s+)?(?:फोन|मोबाईल)\s+(?:नंबर\s+)?(?:आहे\s+)?(.+)/i,
    ],
    FILL_TITLE: [
      /(?:तक्रारीचे?\s+)?(?:शीर्षक|टायटल)\s+(?:आहे\s+)?(.+)/i,
      /(?:समस्या|प्रश्न)\s+(?:आहे\s+)?(.+)/i,
    ],
    FILL_DESCRIPTION: [
      /(?:तक्रारीचे?\s+)?(?:वर्णन|तपशील)\s+(?:आहे\s+)?(.+)/i,
      /(?:मला\s+)?(?:सांगायचे?\s+आहे\s+(?:की\s+)?)?(.+)/i,
    ],
    FILL_ADDRESS: [
      /(?:माझा\s+)?(?:पत्ता|ठिकाण)\s+(?:आहे\s+)?(.+)/i,
      /मी\s+(.+?)\s+(?:ला|मध्ये)\s+राहतो/i,
    ],
    SELECT_CATEGORY: [
      /(?:श्रेणी|कॅटेगरी)\s+(?:आहे\s+)?(.+)/i,
      /हे\s+(.+?)\s+(?:बद्दल|संबंधित)\s+आहे/i,
    ],
    SELECT_WARD: [
      /(?:वॉर्ड|प्रभाग)\s+(?:नंबर\s+)?(.+)/i,
      /मी\s+(?:वॉर्ड|प्रभाग)\s+(.+?)\s+मध्ये\s+राहतो/i,
    ],
    NEXT_STEP: [
      /^(?:पुढे|पुढे\s+जा|चालू\s+ठेव)$/i,
      /^(?:पुढची\s+(?:पायरी|स्टेप))$/i,
    ],
    PREVIOUS_STEP: [
      /^(?:मागे|परत|मागे\s+जा)$/i,
      /^(?:मागची\s+(?:पायरी|स्टेप))$/i,
    ],
    GO_TO_STEP: [
      /(?:पायरी|स्टेप)\s+(?:नंबर\s+)?(\d+|एक|दोन|तीन|चार)\s+(?:वर\s+)?(?:जा)?/i,
    ],
    SUBMIT_FORM: [
      /^(?:सबमिट\s+करा|पाठवा|दाखल\s+करा)$/i,
      /^(?:तक्रार\s+)?(?:पाठव|जमा\s+कर)$/i,
    ],
    CLEAR_FIELD: [
      /(?:पुसा|काढा|मिटवा)\s+(.+)/i,
    ],
    REPEAT: [
      /^(?:पुन्हा\s+सांगा|परत\s+बोला|काय\s+म्हणालात)$/i,
    ],
    HELP: [
      /^(?:मदत|साहाय्य|काय\s+बोलू\s+शकतो)$/i,
    ],
    STOP_LISTENING: [
      /^(?:थांबा|बंद\s+करा|ऐकणे\s+बंद\s+करा)$/i,
    ],
  },
};

// Category mappings for different languages
const CATEGORY_MAPPINGS = {
  'en-US': {
    'water': 'Water Supply',
    'water supply': 'Water Supply',
    'water problem': 'Water Supply',
    'road': 'Road Maintenance',
    'road repair': 'Road Maintenance',
    'road maintenance': 'Road Maintenance',
    'pothole': 'Road Maintenance',
    'garbage': 'Waste Management',
    'garbage collection': 'Waste Management',
    'waste': 'Waste Management',
    'waste management': 'Waste Management',
    'trash': 'Waste Management',
    'street light': 'Street Lighting',
    'street lights': 'Street Lighting',
    'street lighting': 'Street Lighting',
    'lighting': 'Street Lighting',
    'light': 'Street Lighting',
    'electricity': 'Street Lighting',
    'parks': 'Parks & Gardens',
    'parks and gardens': 'Parks & Gardens',
    'park': 'Parks & Gardens',
    'garden': 'Parks & Gardens',
    'public building': 'Public Buildings',
    'public buildings': 'Public Buildings',
    'building': 'Public Buildings',
    'other': 'Other',
    'others': 'Other',
  },
  'hi-IN': {
    'पानी': 'Water Supply',
    'जल आपूर्ति': 'Water Supply',
    'पानी की समस्या': 'Water Supply',
    'सड़क': 'Road Repair',
    'सड़क मरम्मत': 'Road Repair',
    'गड्ढा': 'Road Repair',
    'कचरा': 'Garbage Collection',
    'कूड़ा': 'Garbage Collection',
    'स्ट्रीट लाइट': 'Street Lights',
    'बिजली': 'Street Lights',
    'नाली': 'Drainage',
    'सीवर': 'Drainage',
    'अन्य': 'Other',
  },
  'mr-IN': {
    'पाणी': 'Water Supply',
    'पाणी पुरवठा': 'Water Supply',
    'रस्ता': 'Road Repair',
    'रस्ता दुरुस्ती': 'Road Repair',
    'खड्डा': 'Road Repair',
    'कचरा': 'Garbage Collection',
    'स्ट्रीट लाईट': 'Street Lights',
    'दिवे': 'Street Lights',
    'वीज': 'Street Lights',
    'गटार': 'Drainage',
    'नाली': 'Drainage',
    'इतर': 'Other',
  },
};

// Ward mappings for different languages
const WARD_MAPPINGS = {
  'en-US': {
    '1': 'Ward 1', 'one': 'Ward 1', 'first': 'Ward 1', 'ward 1': 'Ward 1',
    '3': 'Ward 3', 'three': 'Ward 3', 'third': 'Ward 3', 'ward 3': 'Ward 3',
  },
  'hi-IN': {
    '१': 'Ward 1', 'एक': 'Ward 1', 'पहला': 'Ward 1',
    '३': 'Ward 3', 'तीन': 'Ward 3', 'तीसरा': 'Ward 3',
  },
  'mr-IN': {
    '१': 'Ward 1', 'एक': 'Ward 1', 'पहिला': 'Ward 1',
    '३': 'Ward 3', 'तीन': 'Ward 3', 'तिसरा': 'Ward 3',
  },
};

// Step mappings for go to step commands
const STEP_MAPPINGS = {
  'en-US': {
    '1': 0, 'one': 0, 'first': 0, 'personal': 0, 'personal info': 0,
    '2': 1, 'two': 1, 'second': 1, 'issue': 1, 'issue details': 1, 'details': 1,
    '3': 2, 'three': 2, 'third': 2, 'location': 2, 'media': 2, 'location media': 2,
    '4': 3, 'four': 3, 'fourth': 3, 'last': 3, 'review': 3, 'final': 3,
  },
  'hi-IN': {
    '१': 0, 'एक': 0, 'पहला': 0,
    '२': 1, 'दो': 1, 'दूसरा': 1,
    '३': 2, 'तीन': 2, 'तीसरा': 2,
    '४': 3, 'चार': 3, 'चौथा': 3, 'अंतिम': 3,
  },
  'mr-IN': {
    '१': 0, 'एक': 0, 'पहिला': 0,
    '२': 1, 'दोन': 1, 'दुसरा': 1,
    '३': 2, 'तीन': 2, 'तिसरा': 2,
    '४': 3, 'चार': 3, 'चौथा': 3, 'शेवटचा': 3,
  },
};

/**
 * Normalize transcript for better matching
 * @param {string} transcript - Raw speech transcript
 * @returns {string} Normalized transcript
 */
const normalizeTranscript = (transcript) => {
  if (!transcript) return '';
  
  let normalized = transcript
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // Multiple spaces to single
    .replace(/[.,!?;:]+$/g, '')     // Remove trailing punctuation
    .replace(/^[.,!?;:]+/g, '')     // Remove leading punctuation
    .replace(/["'`]/g, '')          // Remove quotes
    .replace(/\b(uh+|um+|hmm+|ah+|er+)\b/gi, '')  // Remove filler words
    .replace(/\s+/g, ' ')           // Clean up spaces again
    .trim();
  
  // Debug logging
  console.log('[VoiceCommand] Raw transcript:', transcript);
  console.log('[VoiceCommand] Normalized transcript:', normalized);
  
  return normalized;
};

/**
 * Extract email from transcript - handles spoken email format
 * @param {string} value - Raw email value from transcript
 * @returns {string} Formatted email
 */
const extractEmail = (value) => {
  if (!value) return '';
  
  return value
    .toLowerCase()
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\bat\b/gi, '@')
    .replace(/\bdot\b/gi, '.')
    .replace(/\s+/g, '')
    .trim();
};

/**
 * Extract phone number from transcript
 * @param {string} value - Raw phone value from transcript
 * @returns {string} Cleaned phone number
 */
const extractPhoneNumber = (value) => {
  if (!value) return '';
  
  // Convert spoken numbers to digits
  const numberWords = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
    'पांच': '5', 'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',
    'शून्य': '0', 'एक': '1', 'दोन': '2', 'तीन': '3', 'चार': '4',
    'पाच': '5', 'सहा': '6', 'सात': '7', 'आठ': '8', 'नऊ': '9',
  };
  
  let result = value.toLowerCase();
  
  // Replace word numbers with digits
  Object.entries(numberWords).forEach(([word, digit]) => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  });
  
  // Remove all non-digit characters
  return result.replace(/\D/g, '');
};

/**
 * Clean and format name from transcript
 * @param {string} value - Raw name from transcript
 * @returns {string} Properly formatted name
 */
const formatName = (value) => {
  if (!value) return '';
  
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get patterns for a language with fallback to English
 * @param {string} language - Language code
 * @returns {object} Command patterns for the language
 */
const getPatternsForLanguage = (language) => {
  // Normalize language code
  const langCode = language.startsWith('en') ? 'en-US' : language;
  return COMMAND_PATTERNS[langCode] || COMMAND_PATTERNS['en-US'];
};

/**
 * Process transcript and detect command intent
 * Uses flexible matching with includes() and regex for robust detection
 * @param {string} transcript - Speech transcript
 * @param {string} language - Current language code
 * @returns {object} Parsed command with type and extracted value
 */
export const processCommand = (transcript, language = 'en-US') => {
  console.log('[VoiceCommand] Processing transcript:', transcript, 'Language:', language);
  
  const normalized = normalizeTranscript(transcript);
  
  if (!normalized) {
    console.log('[VoiceCommand] Empty transcript after normalization');
    return { type: COMMAND_TYPES.UNKNOWN, value: null, rawTranscript: transcript };
  }
  
  // Try flexible keyword-based matching FIRST (more reliable)
  const flexibleResult = tryFlexibleMatching(normalized, transcript, language);
  if (flexibleResult) {
    console.log('[VoiceCommand] Flexible match found:', flexibleResult.type, 'Value:', flexibleResult.value);
    return flexibleResult;
  }
  
  // Fallback to regex pattern matching
  const patterns = getPatternsForLanguage(language);
  
  // Check each command type
  for (const [commandType, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = normalized.match(pattern);
      if (match) {
        let value = match[1] || null;
        
        console.log('[VoiceCommand] Regex match found:', commandType, 'Raw value:', value);
        
        // Process value based on command type
        switch (commandType) {
          case 'FILL_NAME':
            value = formatName(value);
            break;
          case 'FILL_EMAIL':
            value = extractEmail(value);
            break;
          case 'FILL_PHONE':
            value = extractPhoneNumber(value);
            break;
          case 'SELECT_CATEGORY':
            value = mapCategory(value, language);
            break;
          case 'SELECT_WARD':
            value = mapWard(value, language);
            break;
          case 'GO_TO_STEP':
            value = mapStep(value, language);
            break;
          case 'CLEAR_FIELD':
            value = mapFieldName(value, language);
            break;
          case 'FILL_TITLE':
          case 'FILL_DESCRIPTION':
          case 'FILL_ADDRESS':
            value = value ? value.trim() : null;
            // Capitalize first letter for title
            if (commandType === 'FILL_TITLE' && value) {
              value = value.charAt(0).toUpperCase() + value.slice(1);
            }
            break;
        }
        
        console.log('[VoiceCommand] Processed value:', value);
        
        return {
          type: COMMAND_TYPES[commandType],
          value,
          rawTranscript: transcript,
          confidence: calculateConfidence(normalized, pattern),
        };
      }
    }
  }
  
  // If no pattern matched, try to detect if it's potentially form content
  // that should be added to description (only for longer sentences)
  if (normalized.length > 15 && !isNavigationCommand(normalized, language)) {
    console.log('[VoiceCommand] Treating as implicit description content');
    return {
      type: COMMAND_TYPES.FILL_DESCRIPTION,
      value: transcript.trim(),
      rawTranscript: transcript,
      confidence: 0.5,
      isImplicit: true,
    };
  }
  
  console.log('[VoiceCommand] No match found for:', normalized);
  return { type: COMMAND_TYPES.UNKNOWN, value: null, rawTranscript: transcript };
};

/**
 * Try flexible keyword-based matching using includes()
 * This is more reliable than strict regex for speech recognition
 */
const tryFlexibleMatching = (normalized, rawTranscript, language) => {
  console.log('[VoiceCommand] Starting flexible matching for:', normalized);
  
  // ============== NAME PATTERNS ==============
  // Order matters - more specific patterns first
  const nameKeywords = [
    // English variations (most common first)
    'my name is',
    'my full name is',
    'full name is',
    'name is',
    'i am called',
    'call me',
    'i am',
    "i'm",
    'this is',
    // Hindi (romanized and native)
    'mera naam hai',
    'mera naam',
    'mera nam',
    'मेरा नाम है',
    'मेरा नाम',
    // Marathi (romanized and native)
    'mazha nav ahe',
    'majha nav ahe',
    'mazha nav',
    'majha nav',
    'maza nav',
    'माझं नाव आहे',
    'माझे नाव आहे',
    'माझं नाव',
    'माझे नाव',
  ];
  
  // Check for name patterns
  for (const keyword of nameKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (normalized.includes(keywordLower)) {
      console.log('[VoiceCommand] Found name keyword:', keyword);
      // Extract everything after the keyword
      const parts = normalized.split(keywordLower);
      let extracted = parts[parts.length - 1] || ''; // Get the last part after keyword
      // Clean up trailing words like 'hai', 'ahe', 'है', 'आहे'
      extracted = extracted
        .replace(/\s*(hai|h|ahe|है|आहे)\s*$/i, '')
        .trim();
      
      console.log('[VoiceCommand] Extracted name (raw):', extracted);
      
      if (extracted && extracted.length >= 2) {
        const name = formatName(extracted);
        console.log('[VoiceCommand] Formatted name:', name);
        if (name && name.length >= 2) {
          return {
            type: COMMAND_TYPES.FILL_NAME,
            value: name,
            rawTranscript: rawTranscript,
            confidence: 0.95,
          };
        }
      }
    }
  }
  
  // ============== EMAIL PATTERNS ==============
  const emailKeywords = [
    'my email is', 'my email address is', 'email is', 'email address is',
    'my mail is', 'mail is', 'my e-mail is', 'e-mail is',
    'मेरा ईमेल', 'ईमेल', 'माझा ईमेल',
  ];
  
  for (const keyword of emailKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (normalized.includes(keywordLower)) {
      console.log('[VoiceCommand] Found email keyword:', keyword);
      const parts = normalized.split(keywordLower);
      let extracted = parts[parts.length - 1] || '';
      extracted = extracted.replace(/\s*(है|आहे)\s*$/i, '').trim();
      
      if (extracted) {
        const email = extractEmail(extracted);
        console.log('[VoiceCommand] Extracted email:', email);
        if (email && email.includes('@')) {
          return {
            type: COMMAND_TYPES.FILL_EMAIL,
            value: email,
            rawTranscript: rawTranscript,
            confidence: 0.9,
          };
        }
      }
    }
  }
  
  // ============== PHONE PATTERNS ==============
  const phoneKeywords = [
    'my phone number is', 'my phone is', 'phone number is', 'phone is',
    'my mobile number is', 'my mobile is', 'mobile number is', 'mobile is',
    'my contact number is', 'contact number is', 'my number is', 'number is',
    'call me at', 'reach me at',
    'मेरा फोन नंबर', 'मेरा फोन', 'फोन नंबर', 'मोबाइल नंबर',
    'माझा फोन', 'माझा मोबाईल',
  ];
  
  for (const keyword of phoneKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (normalized.includes(keywordLower)) {
      console.log('[VoiceCommand] Found phone keyword:', keyword);
      const parts = normalized.split(keywordLower);
      let extracted = parts[parts.length - 1] || '';
      extracted = extracted.replace(/\s*(है|आहे)\s*$/i, '').trim();
      
      if (extracted) {
        const phone = extractPhoneNumber(extracted);
        console.log('[VoiceCommand] Extracted phone:', phone);
        if (phone && phone.length >= 10) {
          return {
            type: COMMAND_TYPES.FILL_PHONE,
            value: phone,
            rawTranscript: rawTranscript,
            confidence: 0.9,
          };
        }
      }
    }
  }
  
  // ============== NAVIGATION COMMANDS ==============
  const navCommands = {
    NEXT_STEP: ['next', 'next step', 'continue', 'proceed', 'forward', 'go next', 'move next', 'next page',
                'आगे', 'आगे जाओ', 'जारी रखो', 'अगला',
                'पुढे', 'पुढे जा', 'चालू ठेव'],
    PREVIOUS_STEP: ['back', 'go back', 'previous', 'backward', 'move back', 'prev', 'previous step',
                    'पीछे', 'वापस', 'पिछला',
                    'मागे', 'परत'],
    SUBMIT_FORM: ['submit', 'send', 'finish', 'complete', 'done', 'submit complaint', 'send it',
                  'सबमिट', 'सबमिट करो', 'जमा करो', 'भेजो',
                  'सबमिट करा', 'पाठवा', 'दाखल करा'],
    HELP: ['help', 'commands', 'what can i say', 'show commands',
           'मदद', 'सहायता', 'मदत'],
    STOP_LISTENING: ['stop', 'stop listening', 'pause', 'cancel', 'quit',
                     'रुको', 'बंद करो', 'सुनना बंद',
                     'थांबा', 'बंद करा'],
  };
  
  for (const [cmdType, keywords] of Object.entries(navCommands)) {
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      // Match exactly or at word boundaries
      if (normalized === keywordLower || 
          normalized.startsWith(keywordLower + ' ') ||
          normalized.endsWith(' ' + keywordLower) ||
          normalized.includes(' ' + keywordLower + ' ')) {
        console.log('[VoiceCommand] Found navigation command:', cmdType);
        return {
          type: COMMAND_TYPES[cmdType],
          value: null,
          rawTranscript: rawTranscript,
          confidence: 0.95,
        };
      }
    }
  }
  
  // Address patterns
  const addressPatterns = [
    { keywords: ['my address is', 'address is', 'i live at', 'i live in', 'location is'], 
      extract: (text) => text.split(/(?:my )?(?:address|location) is|i live (?:at|in|near)/i)[1] },
    { keywords: ['मेरा पता', 'पता है'], 
      extract: (text) => text.split(/(?:मेरा )?पता(?: है)?/i)[1] },
    { keywords: ['माझा पत्ता'], 
      extract: (text) => text.split(/माझा पत्ता/i)[1]?.replace(/आहे$/i, '') },
  ];
  
  for (const pattern of addressPatterns) {
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        const extracted = pattern.extract(normalized);
        if (extracted && extracted.trim() && extracted.trim().length >= 5) {
          return {
            type: COMMAND_TYPES.FILL_ADDRESS,
            value: extracted.trim(),
            rawTranscript: rawTranscript,
            confidence: 0.85,
          };
        }
      }
    }
  }
  
  // Title patterns
  const titlePatterns = [
    { keywords: ['title is', 'complaint title', 'subject is', 'issue is', 'problem is'], 
      extract: (text) => text.split(/(?:complaint )?(?:title|subject|issue|problem) is/i)[1] },
    { keywords: ['शीर्षक', 'टाइटल'], 
      extract: (text) => text.split(/(?:शीर्षक|टाइटल)(?: है)?/i)[1] },
  ];
  
  for (const pattern of titlePatterns) {
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        const extracted = pattern.extract(normalized);
        if (extracted && extracted.trim() && extracted.trim().length >= 3) {
          let title = extracted.trim();
          title = title.charAt(0).toUpperCase() + title.slice(1);
          return {
            type: COMMAND_TYPES.FILL_TITLE,
            value: title,
            rawTranscript: rawTranscript,
            confidence: 0.85,
          };
        }
      }
    }
  }
  
  // Category patterns
  const categoryKeywords = {
    'Water Supply': ['water', 'water supply', 'water problem', 'पानी', 'पाणी'],
    'Road Maintenance': ['road', 'pothole', 'road repair', 'सड़क', 'रस्ता'],
    'Waste Management': ['garbage', 'waste', 'trash', 'dustbin', 'कचरा', 'कूड़ा'],
    'Street Lighting': ['light', 'street light', 'electricity', 'बिजली', 'दिवे'],
    'Parks & Gardens': ['park', 'garden', 'पार्क', 'बाग'],
    'Public Buildings': ['building', 'public building', 'इमारत'],
  };
  
  if (normalized.includes('category') || normalized.includes('श्रेणी') || normalized.includes('कैटेगरी')) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          return {
            type: COMMAND_TYPES.SELECT_CATEGORY,
            value: category,
            rawTranscript: rawTranscript,
            confidence: 0.85,
          };
        }
      }
    }
  }
  
  // Ward patterns
  const wardMatch = normalized.match(/ward\s*(\d+|one|two|three|four|five|1|2|3|4|5)|वार्ड\s*(\d+|एक|दो|तीन|चार|पांच)/i);
  if (wardMatch) {
    const wardNum = wardMatch[1] || wardMatch[2];
    const mappedWard = mapWard(wardNum, language);
    if (mappedWard) {
      return {
        type: COMMAND_TYPES.SELECT_WARD,
        value: mappedWard,
        rawTranscript: rawTranscript,
        confidence: 0.9,
      };
    }
  }
  
  return null; // No flexible match found
};

/**
 * Check if transcript is a navigation command
 */
const isNavigationCommand = (normalized, language) => {
  const patterns = getPatternsForLanguage(language);
  const navCommands = ['NEXT_STEP', 'PREVIOUS_STEP', 'GO_TO_STEP', 'SUBMIT_FORM', 'STOP_LISTENING', 'HELP', 'REPEAT'];
  
  for (const cmd of navCommands) {
    if (patterns[cmd]) {
      for (const pattern of patterns[cmd]) {
        if (pattern.test(normalized)) return true;
      }
    }
  }
  return false;
};

/**
 * Map category value to standard category
 */
const mapCategory = (value, language) => {
  if (!value) return null;
  
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const mappings = { ...CATEGORY_MAPPINGS['en-US'], ...(CATEGORY_MAPPINGS[langCode] || {}) };
  
  const normalized = value.toLowerCase().trim();
  return mappings[normalized] || value;
};

/**
 * Map ward value to standard ward
 */
const mapWard = (value, language) => {
  if (!value) return null;
  
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const mappings = { ...WARD_MAPPINGS['en-US'], ...(WARD_MAPPINGS[langCode] || {}) };
  
  const normalized = value.toLowerCase().trim();
  return mappings[normalized] || null;
};

/**
 * Map step value to step index
 */
const mapStep = (value, language) => {
  if (value === null || value === undefined) return null;
  
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const mappings = { ...STEP_MAPPINGS['en-US'], ...(STEP_MAPPINGS[langCode] || {}) };
  
  const normalized = String(value).toLowerCase().trim();
  return mappings[normalized] ?? null;
};

/**
 * Map field name for clear command
 */
const mapFieldName = (value, language) => {
  if (!value) return null;
  
  const fieldMappings = {
    'name': 'name', 'full name': 'name', 'नाम': 'name', 'नाव': 'name',
    'email': 'email', 'mail': 'email', 'ईमेल': 'email', 'इमेल': 'email',
    'phone': 'phone', 'mobile': 'phone', 'फोन': 'phone', 'मोबाइल': 'phone',
    'title': 'title', 'शीर्षक': 'title', 'टाइटल': 'title',
    'description': 'description', 'विवरण': 'description', 'वर्णन': 'description',
    'address': 'address', 'location': 'address', 'पता': 'address', 'पत्ता': 'address',
    'category': 'category', 'श्रेणी': 'category', 'कैटेगरी': 'category',
    'ward': 'ward', 'वार्ड': 'ward', 'प्रभाग': 'ward',
  };
  
  const normalized = value.toLowerCase().trim();
  return fieldMappings[normalized] || null;
};

/**
 * Calculate confidence score for matched command
 */
const calculateConfidence = (normalized, pattern) => {
  const match = normalized.match(pattern);
  if (!match) return 0;
  
  // Higher confidence for exact matches, lower for partial
  const matchLength = match[0].length;
  const totalLength = normalized.length;
  
  return Math.min(0.95, 0.5 + (matchLength / totalLength) * 0.5);
};

/**
 * Get available commands for help display
 * @param {string} language - Language code
 * @returns {array} List of example commands
 */
export const getAvailableCommands = (language = 'en-US') => {
  const commands = {
    'en-US': [
      { command: 'My name is [Your Name]', action: 'Fill name field' },
      { command: 'My email is [email]', action: 'Fill email field' },
      { command: 'My phone number is [number]', action: 'Fill phone field' },
      { command: 'Title is [complaint title]', action: 'Fill title field' },
      { command: 'Description is [details]', action: 'Fill description' },
      { command: 'Address is [location]', action: 'Fill address field' },
      { command: 'Category is [type]', action: 'Select category' },
      { command: 'Ward [number]', action: 'Select ward' },
      { command: 'Next / Continue', action: 'Go to next step' },
      { command: 'Back / Previous', action: 'Go to previous step' },
      { command: 'Submit', action: 'Submit the complaint' },
      { command: 'Clear [field name]', action: 'Clear a field' },
      { command: 'Stop listening', action: 'Stop voice input' },
    ],
    'hi-IN': [
      { command: 'मेरा नाम [नाम] है', action: 'नाम भरें' },
      { command: 'मेरा ईमेल [ईमेल] है', action: 'ईमेल भरें' },
      { command: 'मेरा फोन नंबर [नंबर]', action: 'फोन भरें' },
      { command: 'शीर्षक है [शिकायत शीर्षक]', action: 'शीर्षक भरें' },
      { command: 'विवरण है [विवरण]', action: 'विवरण भरें' },
      { command: 'पता है [स्थान]', action: 'पता भरें' },
      { command: 'श्रेणी है [प्रकार]', action: 'श्रेणी चुनें' },
      { command: 'वार्ड [नंबर]', action: 'वार्ड चुनें' },
      { command: 'आगे / जारी रखो', action: 'अगले चरण पर जाएं' },
      { command: 'पीछे / वापस', action: 'पिछले चरण पर जाएं' },
      { command: 'सबमिट करो', action: 'शिकायत जमा करें' },
      { command: 'रुको', action: 'सुनना बंद करो' },
    ],
    'mr-IN': [
      { command: 'माझं नाव [नाव] आहे', action: 'नाव भरा' },
      { command: 'माझा ईमेल [ईमेल] आहे', action: 'ईमेल भरा' },
      { command: 'माझा फोन नंबर [नंबर]', action: 'फोन भरा' },
      { command: 'शीर्षक आहे [तक्रार शीर्षक]', action: 'शीर्षक भरा' },
      { command: 'वर्णन आहे [तपशील]', action: 'वर्णन भरा' },
      { command: 'पत्ता आहे [ठिकाण]', action: 'पत्ता भरा' },
      { command: 'श्रेणी आहे [प्रकार]', action: 'श्रेणी निवडा' },
      { command: 'वॉर्ड [नंबर]', action: 'वॉर्ड निवडा' },
      { command: 'पुढे / चालू ठेव', action: 'पुढच्या पायरीवर जा' },
      { command: 'मागे / परत', action: 'मागच्या पायरीवर जा' },
      { command: 'सबमिट करा', action: 'तक्रार दाखल करा' },
      { command: 'थांबा', action: 'ऐकणे बंद करा' },
    ],
  };
  
  const langCode = language.startsWith('en') ? 'en-US' : language;
  return commands[langCode] || commands['en-US'];
};

/**
 * Get feedback messages for different actions
 * @param {string} action - Action type
 * @param {string} language - Language code
 * @param {object} params - Additional parameters
 * @returns {string} Feedback message
 */
export const getFeedbackMessage = (action, language = 'en-US', params = {}) => {
  const messages = {
    'en-US': {
      NAME_FILLED: `Name set to ${params.value}`,
      EMAIL_FILLED: `Email set to ${params.value}`,
      PHONE_FILLED: `Phone number set to ${params.value}`,
      TITLE_FILLED: 'Title has been set',
      DESCRIPTION_FILLED: 'Description has been updated',
      ADDRESS_FILLED: 'Address has been set',
      CATEGORY_SELECTED: `Category set to ${params.value}`,
      WARD_SELECTED: `Ward set to ${params.value}`,
      NEXT_STEP: `Moving to ${params.stepName || 'next step'}`,
      PREVIOUS_STEP: `Going back to ${params.stepName || 'previous step'}`,
      GO_TO_STEP: `Going to ${params.stepName}`,
      SUBMIT_INITIATED: 'Submitting your complaint',
      FIELD_CLEARED: `${params.fieldName} has been cleared`,
      UNKNOWN_COMMAND: 'Sorry, I did not understand that command. Say "help" for available commands.',
      INVALID_STEP: 'Cannot go to that step right now',
      FORM_INCOMPLETE: 'Please fill all required fields before submitting',
      LISTENING_STOPPED: 'Voice input stopped',
      LISTENING_STARTED: 'Listening. Please speak your command.',
      ERROR: 'An error occurred. Please try again.',
      NO_SPEECH: 'No speech detected. Please try again.',
      NETWORK_ERROR: 'Network error. Please check your connection.',
    },
    'hi-IN': {
      NAME_FILLED: `नाम ${params.value} सेट किया गया`,
      EMAIL_FILLED: `ईमेल ${params.value} सेट किया गया`,
      PHONE_FILLED: `फोन नंबर ${params.value} सेट किया गया`,
      TITLE_FILLED: 'शीर्षक सेट किया गया',
      DESCRIPTION_FILLED: 'विवरण अपडेट किया गया',
      ADDRESS_FILLED: 'पता सेट किया गया',
      CATEGORY_SELECTED: `श्रेणी ${params.value} चुनी गई`,
      WARD_SELECTED: `वार्ड ${params.value} चुना गया`,
      NEXT_STEP: `${params.stepName || 'अगले चरण'} पर जा रहे हैं`,
      PREVIOUS_STEP: `${params.stepName || 'पिछले चरण'} पर वापस जा रहे हैं`,
      GO_TO_STEP: `${params.stepName} पर जा रहे हैं`,
      SUBMIT_INITIATED: 'आपकी शिकायत जमा हो रही है',
      FIELD_CLEARED: `${params.fieldName} साफ कर दिया गया`,
      UNKNOWN_COMMAND: 'माफ कीजिए, मुझे वह कमांड समझ नहीं आया। उपलब्ध कमांड के लिए "मदद" बोलें।',
      INVALID_STEP: 'अभी उस चरण पर नहीं जा सकते',
      FORM_INCOMPLETE: 'जमा करने से पहले सभी आवश्यक फ़ील्ड भरें',
      LISTENING_STOPPED: 'वॉइस इनपुट बंद',
      LISTENING_STARTED: 'सुन रहा हूं। कृपया अपना कमांड बोलें।',
      ERROR: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
      NO_SPEECH: 'कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।',
      NETWORK_ERROR: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
    },
    'mr-IN': {
      NAME_FILLED: `नाव ${params.value} सेट केले`,
      EMAIL_FILLED: `ईमेल ${params.value} सेट केला`,
      PHONE_FILLED: `फोन नंबर ${params.value} सेट केला`,
      TITLE_FILLED: 'शीर्षक सेट केले',
      DESCRIPTION_FILLED: 'वर्णन अपडेट केले',
      ADDRESS_FILLED: 'पत्ता सेट केला',
      CATEGORY_SELECTED: `श्रेणी ${params.value} निवडली`,
      WARD_SELECTED: `वॉर्ड ${params.value} निवडला`,
      NEXT_STEP: `${params.stepName || 'पुढच्या पायरी'} वर जात आहोत`,
      PREVIOUS_STEP: `${params.stepName || 'मागच्या पायरी'} वर परत जात आहोत`,
      GO_TO_STEP: `${params.stepName} वर जात आहोत`,
      SUBMIT_INITIATED: 'तुमची तक्रार दाखल होत आहे',
      FIELD_CLEARED: `${params.fieldName} साफ केले`,
      UNKNOWN_COMMAND: 'माफ करा, मला ती कमांड समजली नाही। उपलब्ध कमांडसाठी "मदत" म्हणा.',
      INVALID_STEP: 'आत्ता त्या पायरीवर जाता येत नाही',
      FORM_INCOMPLETE: 'दाखल करण्यापूर्वी सर्व आवश्यक फील्ड भरा',
      LISTENING_STOPPED: 'व्हॉइस इनपुट थांबले',
      LISTENING_STARTED: 'ऐकत आहे. कृपया तुमची कमांड बोला.',
      ERROR: 'एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
      NO_SPEECH: 'आवाज ओळखला नाही. कृपया पुन्हा प्रयत्न करा.',
      NETWORK_ERROR: 'नेटवर्क त्रुटी. कृपया तुमचे कनेक्शन तपासा.',
    },
  };
  
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const langMessages = messages[langCode] || messages['en-US'];
  
  return langMessages[action] || messages['en-US'][action] || '';
};

export default {
  SUPPORTED_LANGUAGES,
  COMMAND_TYPES,
  processCommand,
  getAvailableCommands,
  getFeedbackMessage,
};
