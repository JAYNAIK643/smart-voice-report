/**
 * Multilingual Intent Parser for AI Chatbot
 * Supports English, Hindi, Marathi
 */

// Intent types
export const INTENTS = {
  SUBMIT_COMPLAINT: 'SUBMIT_COMPLAINT',
  TRACK_COMPLAINT: 'TRACK_COMPLAINT',
  CHECK_STATUS: 'CHECK_STATUS',
  HELP: 'HELP',
  GREETING: 'GREETING',
  UNKNOWN: 'UNKNOWN'
};

// Complaint categories
export const CATEGORIES = {
  STREET_LIGHT: 'Street Light',
  ROAD: 'Roads',
  GARBAGE: 'Garbage',
  WATER: 'Water Supply',
  SEWERAGE: 'Sewerage',
  PUBLIC_BUILDING: 'Public Building',
  PARKS: 'Parks',
  OTHERS: 'Others'
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  'mr-IN': [
    /[अ-ह]/, // Devanagari script
    /\b(majhi|tumchi|ahe|nahi|kar|de|aahe|jhali|kashi|kuth|kay)\b/i
  ],
  'hi-IN': [
    /[अ-ह]/, // Devanagari script
    /\b(meri|mera|karo|kare|hai|nahi|kaise|kahan|kya|kripaya)\b/i
  ],
  'en-US': [
    /^[a-zA-Z\s\d\W]+$/ // Primarily Latin script
  ]
};

// Intent detection patterns by language
const INTENT_PATTERNS = {
  'en-US': {
    [INTENTS.SUBMIT_COMPLAINT]: [
      /submit\s+(?:a\s+)?complaint/i,
      /file\s+(?:a\s+)?complaint/i,
      /new\s+complaint/i,
      /create\s+complaint/i,
      /report\s+(?:an?\s+)?issue/i,
      /register\s+complaint/i
    ],
    [INTENTS.TRACK_COMPLAINT]: [
      /track\s+(?:my\s+)?complaint/i,
      /check\s+(?:my\s+)?complaint/i,
      /complaint\s+status/i,
      /where\s+is\s+(?:my\s+)?complaint/i,
      /view\s+(?:my\s+)?complaint/i
    ],
    [INTENTS.CHECK_STATUS]: [
      /check\s+status/i,
      /status\s+check/i,
      /what['']?s\s+(?:the\s+)?status/i
    ],
    [INTENTS.HELP]: [
      /help/i,
      /assist/i,
      /support/i,
      /how\s+(?:to|do)/i
    ],
    [INTENTS.GREETING]: [
      /^(hi|hello|hey|greetings|namaste|namaskar)/i
    ]
  },
  'hi-IN': {
    [INTENTS.SUBMIT_COMPLAINT]: [
      /शिकायत\s+(?:दर्ज\s+)?(?:कर|करीए|करें|करो)/i,
      /complaint\s+(?:dijiye|karein|karo)/i,
      /नई\s+शिकायत/i,
      /meri\s+shikayat\s+(?:dijiye|karein)/i,
      /शिकायत\s+भेज/i,
      /समस्या\s+दर्ज/i
    ],
    [INTENTS.TRACK_COMPLAINT]: [
      /शिकायत\s+(?:ट्रैक|जांच|देख|स्थिति)/i,
      /shikayat\s+(?:track|check|dekhein)/i,
      /मेरी\s+शिकायत\s+(?:कहां|कैसी)/i,
      /status\s+(?:bataiye|check)/i
    ],
    [INTENTS.CHECK_STATUS]: [
      /स्थिति\s+बताइए/i,
      /status\s+bataiye/i,
      /क्या\s+हुआ/i
    ],
    [INTENTS.HELP]: [
      /मदद/i,
      /help/i,
      /सहायता/i,
      /कैसे/i
    ],
    [INTENTS.GREETING]: [
      /^(नमस्ते|नमस्कार|हाय|हैलो)/i
    ]
  },
  'mr-IN': {
    [INTENTS.SUBMIT_COMPLAINT]: [
      /तक्रार\s+(?:दाखल\s+)?(?:कर|करी|का)/i,
      /complaint\s+(?:kara|kar|dakhala)/i,
      /majhi\s+takrar\s+(?:dakhala\s+)?kara/i,
      /तक्रार\s+पाठव/i,
      /समस्या\s+नोंदव/i
    ],
    [INTENTS.TRACK_COMPLAINT]: [
      /तक्रार\s+(?:ट्रॅक|तपास|बघ|स्थिती)/i,
      /takrar\s+(?:track|tapas)/i,
      /माझी\s+तक्रार\s+(?:कुठे|कशी)/i,
      /status\s+(?:sanga|dakhal)/i
    ],
    [INTENTS.CHECK_STATUS]: [
      /स्थिती\s+सांग/i,
      /status\s+sanga/i,
      /काय\s+झाल/i
    ],
    [INTENTS.HELP]: [
      /मदत/i,
      /help/i,
      /साहाय्य/i,
      /कसे/i
    ],
    [INTENTS.GREETING]: [
      /^(नमस्कार|नमस्ते|हाय|हॅलो)/i
    ]
  }
};

// Category detection patterns
const CATEGORY_PATTERNS = {
  'en-US': {
    [CATEGORIES.STREET_LIGHT]: /street\s*light|lamp\s*post|lighting/i,
    [CATEGORIES.ROAD]: /road|street|pothole|pathway/i,
    [CATEGORIES.GARBAGE]: /garbage|trash|waste|dump|cleaning/i,
    [CATEGORIES.WATER]: /water|pipe|leak|supply/i,
    [CATEGORIES.SEWERAGE]: /sewer|drain|sewage|manhole/i,
    [CATEGORIES.PUBLIC_BUILDING]: /building|school|hospital|office/i,
    [CATEGORIES.PARKS]: /park|garden|playground/i
  },
  'hi-IN': {
    [CATEGORIES.STREET_LIGHT]: /स्ट्रीट\s*लाइट|लाइट|बल्ब|रोशनी/i,
    [CATEGORIES.ROAD]: /सड़क|रोड|गड्ढा|पथ/i,
    [CATEGORIES.GARBAGE]: /कचरा|गंदगी|सफाई|waste/i,
    [CATEGORIES.WATER]: /पानी|पाइप|लीक|पानी\s*आपूर्ति/i,
    [CATEGORIES.SEWERAGE]: /सीवर|नाली|ड्रेन|मैनहोल/i,
    [CATEGORIES.PUBLIC_BUILDING]: /इमारत|स्कूल|अस्पताल|दफ्तर/i,
    [CATEGORIES.PARKS]: /पार्क|बगीचा|खेल\s*का\s*मैदान/i
  },
  'mr-IN': {
    [CATEGORIES.STREET_LIGHT]: /स्ट्रीट\s*लाइट|लाइट|बल्ब|रोशणाई/i,
    [CATEGORIES.ROAD]: /रस्ता|रोड|खड्डा|पथ/i,
    [CATEGORIES.GARBAGE]: /कचरा|घाण|स्वच्छता|waste/i,
    [CATEGORIES.WATER]: /पाणी|पाइप|गळती|पाणी\s*पुरवठा/i,
    [CATEGORIES.SEWERAGE]: /सीवर|गटार|ड्रेन|मॅनहोल/i,
    [CATEGORIES.PUBLIC_BUILDING]: /इमारत|शाळा|रुग्णालय|कार्यालय/i,
    [CATEGORIES.PARKS]: /पार्क|बाग|खेळ\s*मैदान/i
  }
};

/**
 * Detect language from input text
 * @param {string} text - User input
 * @returns {string} Language code
 */
export const detectLanguage = (text) => {
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return lang;
      }
    }
  }
  return 'en-US'; // Default to English
};

/**
 * Parse intent from user input
 * @param {string} text - User input
 * @param {string} language - Detected language
 * @returns {string} Intent type
 */
export const parseIntent = (text, language = 'en-US') => {
  const patterns = INTENT_PATTERNS[language] || INTENT_PATTERNS['en-US'];
  
  for (const [intent, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      if (regex.test(text)) {
        return intent;
      }
    }
  }
  
  return INTENTS.UNKNOWN;
};

/**
 * Detect complaint category from input
 * @param {string} text - User input
 * @param {string} language - Detected language
 * @returns {string|null} Category or null
 */
export const detectCategory = (text, language = 'en-US') => {
  const patterns = CATEGORY_PATTERNS[language] || CATEGORY_PATTERNS['en-US'];
  
  for (const [category, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      return category;
    }
  }
  
  return null;
};

/**
 * Extract location from input text
 * @param {string} text - User input
 * @returns {string|null} Location or null
 */
export const extractLocation = (text) => {
  // Common location patterns across languages
  const locationPatterns = [
    /(?:at|near|in|on)\s+([A-Za-z0-9\s,]+(?:street|road|avenue|lane|area|sector|block|colony|nagar|park|chowk))/i,
    /(?:location|address)[\s:]+([A-Za-z0-9\s,]+)/i,
    /(?:yaha|yahan|ithe)\s+([A-Za-z0-9\s,]+)/i,
    /([A-Za-z0-9\s]+(?:road|street|nagar|colony|area))/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};

/**
 * Generate auto-fill description based on category
 * @param {string} category - Complaint category
 * @param {string} language - Language code
 * @returns {string} Auto-generated description
 */
export const generateDescription = (category, language = 'en-US') => {
  const descriptions = {
    'en-US': {
      [CATEGORIES.STREET_LIGHT]: 'Street light is not working properly. Kindly resolve the issue.',
      [CATEGORIES.ROAD]: 'Road condition is poor with potholes. Please repair urgently.',
      [CATEGORIES.GARBAGE]: 'Garbage is not being collected properly. Area needs cleaning.',
      [CATEGORIES.WATER]: 'Water supply is irregular/low pressure. Please look into this matter.',
      [CATEGORIES.SEWERAGE]: 'Sewerage/drainage issue causing inconvenience. Please fix.',
      [CATEGORIES.PUBLIC_BUILDING]: 'Issue with public building/facility. Needs attention.',
      [CATEGORIES.PARKS]: 'Park maintenance issue. Please address.',
      [CATEGORIES.OTHERS]: 'Issue reported for municipal attention. Please resolve.'
    },
    'hi-IN': {
      [CATEGORIES.STREET_LIGHT]: 'स्ट्रीट लाइट ठीक से काम नहीं कर रही है। कृपया समस्या का समाधान करें।',
      [CATEGORIES.ROAD]: 'सड़क की हालत खराब है, गड्ढे हैं। कृपया जल्दी से जल्दी मरम्मत करें।',
      [CATEGORIES.GARBAGE]: 'कचरा सही से नहीं उठाया जा रहा है। क्षेत्र की सफाई की आवश्यकता है।',
      [CATEGORIES.WATER]: 'पानी की आपूर्ति अनियमित है। कृपया इस मामले को देखें।',
      [CATEGORIES.SEWERAGE]: 'सीवरेज/नाली की समस्या से परेशानी हो रही है। कृपया ठीक करें।',
      [CATEGORIES.PUBLIC_BUILDING]: 'सार्वजनिक इमारत/सुविधा में समस्या है। ध्यान देने की आवश्यकता है।',
      [CATEGORIES.PARKS]: 'पार्क के रखरखाव में समस्या है। कृपया ध्यान दें।',
      [CATEGORIES.OTHERS]: 'नगर पालिका के ध्यान के लिए समस्या दर्ज की गई है। कृपया समाधान करें।'
    },
    'mr-IN': {
      [CATEGORIES.STREET_LIGHT]: 'स्ट्रीट लाइट व्यवस्थितपणे काम करत नाही. कृपया समस्या सोडवा.',
      [CATEGORIES.ROAD]: 'रस्त्याची अवस्था खराब आहे, खड्डे आहेत. कृपया तातडीने दुरुस्ती करा.',
      [CATEGORIES.GARBAGE]: 'कचरा व्यवस्थित उचलला जात नाही. परिसराची स्वच्छता आवश्यक आहे.',
      [CATEGORIES.WATER]: 'पाणी पुरवठा अनियमित आहे. कृपया या बाबतीची दखल घ्या.',
      [CATEGORIES.SEWERAGE]: 'सीवरेज/गटाराची समस्या असुविधा कारणीभूत आहे. कृपया दुरुस्ती करा.',
      [CATEGORIES.PUBLIC_BUILDING]: 'सार्वजनिक इमारतीत/सुविधेत समस्या आहे. लक्ष देणे आवश्यक आहे.',
      [CATEGORIES.PARKS]: 'पार्क देखभालीत समस्या आहे. कृपया लक्ष द्या.',
      [CATEGORIES.OTHERS]: 'महानगरपालिकेच्या लक्षात समस्या नोंदवली आहे. कृपया सोडवा.'
    }
  };
  
  return descriptions[language]?.[category] || descriptions['en-US'][CATEGORIES.OTHERS];
};

/**
 * Main parsing function - analyzes user input completely
 * @param {string} text - User input
 * @returns {Object} Parsed result with intent, language, category, etc.
 */
export const parseUserInput = (text) => {
  const language = detectLanguage(text);
  const intent = parseIntent(text, language);
  const category = detectCategory(text, language);
  const location = extractLocation(text);
  const description = category ? generateDescription(category, language) : null;
  
  return {
    text,
    language,
    intent,
    category,
    location,
    description,
    confidence: intent !== INTENTS.UNKNOWN ? 0.8 : 0.3
  };
};

export default {
  INTENTS,
  CATEGORIES,
  detectLanguage,
  parseIntent,
  detectCategory,
  extractLocation,
  generateDescription,
  parseUserInput
};
