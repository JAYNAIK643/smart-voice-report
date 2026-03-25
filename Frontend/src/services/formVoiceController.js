/**
 * Form Voice Controller
 * Handles form-specific voice control actions and field mapping
 * Bridges command processor with form state management
 */

import { COMMAND_TYPES, getFeedbackMessage } from './commandProcessor';

// Field configuration with validation and step mapping
export const FORM_FIELDS = {
  name: {
    step: 0,
    required: true,
    type: 'text',
    validate: (value) => value && value.trim().length >= 2,
    errorMessage: 'Name must be at least 2 characters',
  },
  email: {
    step: 0,
    required: true,
    type: 'email',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    errorMessage: 'Please provide a valid email address',
  },
  phone: {
    step: 0,
    required: true,
    type: 'tel',
    validate: (value) => /^\d{10}$/.test(value),
    errorMessage: 'Phone number must be 10 digits',
  },
  category: {
    step: 1,
    required: true,
    type: 'select',
    options: ['Waste Management', 'Water Supply', 'Road Maintenance', 'Street Lighting', 'Parks & Gardens', 'Public Buildings', 'Other'],
    validate: (value) => value && value.trim().length > 0,
    errorMessage: 'Please select a category',
  },
  title: {
    step: 1,
    required: true,
    type: 'text',
    validate: (value) => value && value.trim().length >= 5,
    errorMessage: 'Title must be at least 5 characters',
  },
  description: {
    step: 1,
    required: true,
    type: 'textarea',
    validate: (value) => value && value.trim().length >= 20,
    errorMessage: 'Description must be at least 20 characters',
  },
  address: {
    step: 2,
    required: true,
    type: 'textarea',
    validate: (value) => value && value.trim().length >= 10,
    errorMessage: 'Address must be at least 10 characters',
  },
  ward: {
    step: 2,
    required: true,
    type: 'select',
    options: ['Ward 1', 'Ward 3'], // Match actual form options
    validate: (value) => ['Ward 1', 'Ward 3'].includes(value),
    errorMessage: 'Please select a valid ward',
  },
};

// Step names for navigation feedback
export const STEP_NAMES = {
  'en-US': ['Personal Info', 'Issue Details', 'Location & Media', 'Review'],
  'hi-IN': ['व्यक्तिगत जानकारी', 'समस्या विवरण', 'स्थान और मीडिया', 'समीक्षा'],
  'mr-IN': ['वैयक्तिक माहिती', 'समस्या तपशील', 'स्थान आणि मीडिया', 'पुनरावलोकन'],
};

// Field names in different languages for feedback
const FIELD_NAMES = {
  'en-US': {
    name: 'Name', email: 'Email', phone: 'Phone', category: 'Category',
    title: 'Title', description: 'Description', address: 'Address', ward: 'Ward',
  },
  'hi-IN': {
    name: 'नाम', email: 'ईमेल', phone: 'फोन', category: 'श्रेणी',
    title: 'शीर्षक', description: 'विवरण', address: 'पता', ward: 'वार्ड',
  },
  'mr-IN': {
    name: 'नाव', email: 'ईमेल', phone: 'फोन', category: 'श्रेणी',
    title: 'शीर्षक', description: 'वर्णन', address: 'पत्ता', ward: 'वॉर्ड',
  },
};

/**
 * Get localized step name
 */
export const getStepName = (stepIndex, language = 'en-US') => {
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const names = STEP_NAMES[langCode] || STEP_NAMES['en-US'];
  return names[stepIndex] || '';
};

/**
 * Get localized field name
 */
export const getFieldName = (fieldKey, language = 'en-US') => {
  const langCode = language.startsWith('en') ? 'en-US' : language;
  const names = FIELD_NAMES[langCode] || FIELD_NAMES['en-US'];
  return names[fieldKey] || fieldKey;
};

/**
 * Create form voice controller instance
 * @param {object} config - Controller configuration
 * @returns {object} Controller methods
 */
export const createFormVoiceController = (config) => {
  const {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    onSubmit,
    onError,
    onFeedback,
    language = 'en-US',
    totalSteps = 4,
  } = config;
  
  console.log('[FormController] Created with config:', {
    language,
    totalSteps,
    currentStep,
  });

  /**
   * Update a form field value
   */
  const updateField = (fieldName, value) => {
    console.log('[FormController] updateField called:', { fieldName, value });
    
    const field = FORM_FIELDS[fieldName];
    
    if (!field) {
      console.error('[FormController] Unknown field:', fieldName);
      return { success: false, error: `Unknown field: ${fieldName}` };
    }

    // Skip validation for basic text fields if value is reasonable
    let isValid = true;
    if (field.validate) {
      isValid = field.validate(value);
      console.log('[FormController] Validation result:', isValid);
    }
    
    // For name field, be more lenient - accept any non-empty value >= 2 chars
    if (fieldName === 'name' && value && value.trim().length >= 2) {
      isValid = true;
    }

    if (!isValid) {
      console.warn('[FormController] Validation failed for', fieldName, ':', field.errorMessage);
      return { success: false, error: field.errorMessage };
    }

    // For select fields, ensure value is in options
    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      // Try case-insensitive match
      const match = field.options.find(opt => 
        opt.toLowerCase() === value.toLowerCase()
      );
      if (match) {
        value = match;
      } else {
        console.warn('[FormController] Invalid option for', fieldName, ':', value);
        return { success: false, error: `Invalid option for ${fieldName}` };
      }
    }

    // CRITICAL: Update the form state
    console.log('[FormController] Updating form field:', fieldName, 'with value:', value);
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };
      console.log('[FormController] New form data:', newData);
      return newData;
    });
    
    return { success: true, value };
  };

  /**
   * Clear a form field
   */
  const clearField = (fieldName) => {
    if (!FORM_FIELDS[fieldName]) {
      return { success: false, error: `Unknown field: ${fieldName}` };
    }

    setFormData(prev => ({ ...prev, [fieldName]: '' }));
    return { success: true };
  };

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    if (currentStep >= totalSteps - 1) {
      return { success: false, error: 'Already at the last step' };
    }

    // Validate current step fields before proceeding
    const validation = validateStep(currentStep);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    return { success: true, step: newStep, stepName: getStepName(newStep, language) };
  };

  /**
   * Navigate to previous step
   */
  const previousStep = () => {
    if (currentStep <= 0) {
      return { success: false, error: 'Already at the first step' };
    }

    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    return { success: true, step: newStep, stepName: getStepName(newStep, language) };
  };

  /**
   * Navigate to specific step
   */
  const goToStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      return { success: false, error: 'Invalid step number' };
    }

    // Can only go forward if current steps are valid
    if (stepIndex > currentStep) {
      for (let i = currentStep; i < stepIndex; i++) {
        const validation = validateStep(i);
        if (!validation.valid) {
          return { success: false, error: `Please complete ${getStepName(i, language)} first` };
        }
      }
    }

    setCurrentStep(stepIndex);
    return { success: true, step: stepIndex, stepName: getStepName(stepIndex, language) };
  };

  /**
   * Validate a specific step
   */
  const validateStep = (step) => {
    const errors = [];
    
    Object.entries(FORM_FIELDS).forEach(([fieldName, field]) => {
      if (field.step === step && field.required) {
        const value = formData[fieldName];
        if (!value || (field.validate && !field.validate(value))) {
          errors.push(`${getFieldName(fieldName, language)}: ${field.errorMessage}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const errors = [];
    
    Object.entries(FORM_FIELDS).forEach(([fieldName, field]) => {
      if (field.required) {
        const value = formData[fieldName];
        if (!value || (field.validate && !field.validate(value))) {
          errors.push(`${getFieldName(fieldName, language)}: ${field.errorMessage}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  };

  /**
   * Submit the form
   */
  const submitForm = async () => {
    const validation = validateForm();
    
    if (!validation.valid) {
      return { 
        success: false, 
        error: getFeedbackMessage('FORM_INCOMPLETE', language),
        details: validation.errors 
      };
    }

    if (onSubmit) {
      try {
        await onSubmit();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  };

  /**
   * Process a command and execute the corresponding action
   */
  const executeCommand = async (command) => {
    const { type, value, isImplicit, confidence } = command;
    
    console.log('[FormController] executeCommand called:', {
      type,
      value,
      isImplicit,
      confidence,
    });
    
    let result = { success: false };
    let feedbackType = '';
    let feedbackParams = {};

    switch (type) {
      case COMMAND_TYPES.FILL_NAME:
        console.log('[FormController] Executing FILL_NAME with value:', value);
        result = updateField('name', value);
        console.log('[FormController] FILL_NAME result:', result);
        feedbackType = result.success ? 'NAME_FILLED' : 'ERROR';
        feedbackParams = { value };
        break;

      case COMMAND_TYPES.FILL_EMAIL:
        result = updateField('email', value);
        feedbackType = result.success ? 'EMAIL_FILLED' : 'ERROR';
        feedbackParams = { value };
        break;

      case COMMAND_TYPES.FILL_PHONE:
        result = updateField('phone', value);
        feedbackType = result.success ? 'PHONE_FILLED' : 'ERROR';
        feedbackParams = { value };
        break;

      case COMMAND_TYPES.FILL_TITLE:
        result = updateField('title', value);
        feedbackType = result.success ? 'TITLE_FILLED' : 'ERROR';
        break;

      case COMMAND_TYPES.FILL_DESCRIPTION:
        // For description, append if implicit (natural speech), replace if explicit command
        if (isImplicit && confidence < 0.7) {
          const currentDesc = formData.description || '';
          const newDesc = currentDesc ? `${currentDesc} ${value}` : value;
          result = updateField('description', newDesc);
        } else {
          result = updateField('description', value);
        }
        feedbackType = result.success ? 'DESCRIPTION_FILLED' : 'ERROR';
        break;

      case COMMAND_TYPES.FILL_ADDRESS:
        result = updateField('address', value);
        feedbackType = result.success ? 'ADDRESS_FILLED' : 'ERROR';
        break;

      case COMMAND_TYPES.SELECT_CATEGORY:
        result = updateField('category', value);
        feedbackType = result.success ? 'CATEGORY_SELECTED' : 'ERROR';
        feedbackParams = { value };
        break;

      case COMMAND_TYPES.SELECT_WARD:
        if (value) {
          result = updateField('ward', value);
          feedbackType = result.success ? 'WARD_SELECTED' : 'ERROR';
          feedbackParams = { value };
        } else {
          result = { success: false, error: 'Invalid ward number' };
          feedbackType = 'ERROR';
        }
        break;

      case COMMAND_TYPES.NEXT_STEP:
        result = nextStep();
        feedbackType = result.success ? 'NEXT_STEP' : 'INVALID_STEP';
        feedbackParams = { stepName: result.stepName };
        break;

      case COMMAND_TYPES.PREVIOUS_STEP:
        result = previousStep();
        feedbackType = result.success ? 'PREVIOUS_STEP' : 'INVALID_STEP';
        feedbackParams = { stepName: result.stepName };
        break;

      case COMMAND_TYPES.GO_TO_STEP:
        if (value !== null && value !== undefined) {
          result = goToStep(value);
          feedbackType = result.success ? 'GO_TO_STEP' : 'INVALID_STEP';
          feedbackParams = { stepName: result.stepName };
        } else {
          result = { success: false, error: 'Invalid step' };
          feedbackType = 'INVALID_STEP';
        }
        break;

      case COMMAND_TYPES.SUBMIT_FORM:
        result = await submitForm();
        feedbackType = result.success ? 'SUBMIT_INITIATED' : 'FORM_INCOMPLETE';
        break;

      case COMMAND_TYPES.CLEAR_FIELD:
        if (value) {
          result = clearField(value);
          feedbackType = result.success ? 'FIELD_CLEARED' : 'ERROR';
          feedbackParams = { fieldName: getFieldName(value, language) };
        } else {
          result = { success: false, error: 'Unknown field to clear' };
          feedbackType = 'ERROR';
        }
        break;

      case COMMAND_TYPES.HELP:
        result = { success: true, action: 'SHOW_HELP' };
        feedbackType = 'HELP';
        break;

      case COMMAND_TYPES.REPEAT:
        result = { success: true, action: 'REPEAT' };
        feedbackType = 'REPEAT';
        break;

      case COMMAND_TYPES.STOP_LISTENING:
        result = { success: true, action: 'STOP_LISTENING' };
        feedbackType = 'LISTENING_STOPPED';
        break;

      case COMMAND_TYPES.UNKNOWN:
      default:
        result = { success: false };
        feedbackType = 'UNKNOWN_COMMAND';
        break;
    }

    // Generate feedback message
    const feedback = getFeedbackMessage(feedbackType, language, feedbackParams);

    // Call feedback handler if provided
    if (onFeedback) {
      onFeedback({
        type: feedbackType,
        message: feedback,
        success: result.success,
        error: result.error,
      });
    }

    // Call error handler if there was an error
    if (!result.success && onError && result.error) {
      onError(result.error);
    }

    return {
      ...result,
      feedbackType,
      feedback,
      command,
    };
  };

  /**
   * Get current form state summary
   */
  const getFormSummary = () => {
    const filledFields = Object.entries(FORM_FIELDS)
      .filter(([fieldName]) => formData[fieldName])
      .map(([fieldName]) => fieldName);

    const missingRequiredFields = Object.entries(FORM_FIELDS)
      .filter(([fieldName, field]) => field.required && !formData[fieldName])
      .map(([fieldName]) => fieldName);

    return {
      currentStep,
      totalSteps,
      filledFields,
      missingRequiredFields,
      isComplete: missingRequiredFields.length === 0,
      progress: Math.round((filledFields.length / Object.keys(FORM_FIELDS).length) * 100),
    };
  };

  /**
   * Get fields for current step
   */
  const getCurrentStepFields = () => {
    return Object.entries(FORM_FIELDS)
      .filter(([, field]) => field.step === currentStep)
      .map(([fieldName, field]) => ({
        name: fieldName,
        ...field,
        value: formData[fieldName] || '',
        displayName: getFieldName(fieldName, language),
      }));
  };

  return {
    updateField,
    clearField,
    nextStep,
    previousStep,
    goToStep,
    validateStep,
    validateForm,
    submitForm,
    executeCommand,
    getFormSummary,
    getCurrentStepFields,
  };
};

/**
 * Get hint text for current step fields
 */
export const getStepHints = (step, language = 'en-US') => {
  const hints = {
    'en-US': {
      0: 'Say "My name is...", "My email is...", or "My phone number is..." to fill the fields.',
      1: 'Say "Category is...", "Title is...", or describe your complaint.',
      2: 'Say "Address is..." or "Ward number..." to fill location details.',
      3: 'Review your information and say "Submit" to file your complaint.',
    },
    'hi-IN': {
      0: '"मेरा नाम है...", "मेरा ईमेल है...", या "मेरा फोन नंबर है..." बोलें।',
      1: '"श्रेणी है...", "शीर्षक है...", या अपनी शिकायत का विवरण दें।',
      2: '"पता है..." या "वार्ड नंबर..." बोलकर स्थान भरें।',
      3: 'अपनी जानकारी जांचें और "सबमिट करो" बोलें।',
    },
    'mr-IN': {
      0: '"माझं नाव आहे...", "माझा ईमेल आहे...", किंवा "माझा फोन नंबर आहे..." म्हणा।',
      1: '"श्रेणी आहे...", "शीर्षक आहे...", किंवा तुमच्या तक्रारीचे वर्णन करा।',
      2: '"पत्ता आहे..." किंवा "वॉर्ड नंबर..." म्हणून स्थान भरा।',
      3: 'तुमची माहिती तपासा आणि "सबमिट करा" म्हणा।',
    },
  };

  const langCode = language.startsWith('en') ? 'en-US' : language;
  return hints[langCode]?.[step] || hints['en-US'][step] || '';
};

export default {
  FORM_FIELDS,
  STEP_NAMES,
  createFormVoiceController,
  getStepName,
  getFieldName,
  getStepHints,
};
