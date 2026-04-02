import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, FileText, Search, Phone, Loader2, Minimize2, Maximize2, RefreshCw, WifiOff, Sparkles, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import VoiceInput from '@/components/VoiceInput';
import { parseUserInput, INTENTS, CATEGORIES } from '@/utils/intentParser';
import { 
  VoiceRecognizer, 
  voiceSynthesizer, 
  getResponseMessage,
  isSpeechSupported,
  CameraHelper
} from '@/utils/voiceChatbot';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const CHAT_URL = `${BACKEND_URL}/api/ai/chat`;
const STORAGE_KEY = 'smartcity-chatbot-history';
const MAX_RETRIES = 3;

const defaultMessage = {
  role: 'assistant',
  content: "Hello! 👋 I'm your Municipal Grievance Assistant. How can I help you today? You can ask me about submitting complaints, tracking their status, or learn about our services."
};

// Extract complaint details from conversation
const extractComplaintDetails = (messages) => {
  const fullConversation = messages.map(m => m.content).join(' ').toLowerCase();
  
  const details = {
    category: null,
    description: null,
    location: null,
  };

  // Detect category
  if (fullConversation.includes('water') || fullConversation.includes('pipe') || fullConversation.includes('leak')) {
    details.category = 'water';
  } else if (fullConversation.includes('road') || fullConversation.includes('pothole') || fullConversation.includes('street')) {
    details.category = 'roads';
  } else if (fullConversation.includes('garbage') || fullConversation.includes('trash') || fullConversation.includes('waste') || fullConversation.includes('dump')) {
    details.category = 'garbage';
  } else if (fullConversation.includes('light') || fullConversation.includes('lamp') || fullConversation.includes('dark')) {
    details.category = 'lighting';
  }

  // Extract location (simple pattern matching)
  const locationPatterns = [
    /(?:at|near|in|on)\s+([A-Za-z0-9\s,]+(?:street|road|avenue|lane|area|sector|block|colony|nagar|park))/gi,
    /(?:location|address)[\s:]+([A-Za-z0-9\s,]+)/gi,
  ];
  
  for (const pattern of locationPatterns) {
    const match = pattern.exec(fullConversation);
    if (match) {
      details.location = match[1].trim();
      break;
    }
  }

  // Extract description from user messages
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length > 0) {
    const longestMessage = userMessages.reduce((a, b) => 
      a.content.length > b.content.length ? a : b
    );
    if (longestMessage.content.length > 20) {
      details.description = longestMessage.content;
    }
  }

  return details;
};

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary/50 hover:bg-secondary rounded-lg transition-all text-foreground border border-border/50 hover:border-primary/30 hover:shadow-sm"
  >
    <Icon className="w-4 h-4 text-primary" />
    <span className="whitespace-nowrap">{label}</span>
  </motion.button>
);

const Message = ({ role, content, isTyping }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    className={`flex gap-2 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
  >
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
        role === 'user' 
          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
          : 'bg-gradient-to-br from-secondary to-muted text-secondary-foreground'
      }`}
    >
      {role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
    </motion.div>
    <div className={`max-w-[80%] px-4 py-3 shadow-sm ${
      role === 'user' 
        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md' 
        : 'bg-gradient-to-br from-card to-muted/50 text-card-foreground border border-border/50 rounded-2xl rounded-bl-md'
    }`}>
      {isTyping ? (
        <div className="flex gap-1.5 py-1 px-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ 
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-current rounded-full"
            />
          ))}
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      )}
    </div>
  </motion.div>
);

const AutoFillPrompt = ({ details, onAccept, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.95 }}
    className="mx-2 my-3 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl"
  >
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-sm text-foreground mb-1">Auto-fill complaint form?</h4>
        <p className="text-xs text-muted-foreground mb-3">
          I detected some details from our conversation:
        </p>
        <div className="space-y-1 text-xs mb-3">
          {details.category && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">Category:</span>
              <Badge variant="secondary" className="text-xs capitalize">{details.category}</Badge>
            </div>
          )}
          {details.location && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">Location:</span>
              <span className="text-foreground">{details.location}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onAccept} className="text-xs h-7">
            Fill Form
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} className="text-xs h-7">
            No thanks
          </Button>
        </div>
      </div>
    </div>
  </motion.div>
);

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [defaultMessage];
        }
      }
    }
    return [defaultMessage];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [extractedDetails, setExtractedDetails] = useState(null);
  
  // Voice-related states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognizerRef = useRef(null);
  const navigate = useNavigate();

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track unread messages when minimized
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isTyping) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isMinimized]);

  // Reset unread when maximizing
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Check for complaint details after AI response
  useEffect(() => {
    if (messages.length >= 4) {
      const details = extractComplaintDetails(messages);
      if (details.category && !showAutoFill && !extractedDetails) {
        setExtractedDetails(details);
        setShowAutoFill(true);
      }
    }
  }, [messages, showAutoFill, extractedDetails]);

  // Initialize voice recognizer
  useEffect(() => {
    if (!isSpeechSupported()) {
      setSpeechSupported(false);
      return;
    }

    try {
      recognizerRef.current = new VoiceRecognizer(detectedLanguage);
      
      recognizerRef.current.onResult = (result) => {
        setInput(result.interim || result.final);
        if (result.isFinal && result.final) {
          handleVoiceInput(result.final);
        }
      };
      
      recognizerRef.current.onError = (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
      };
      
      recognizerRef.current.onEnd = () => {
        setIsListening(false);
      };
    } catch (error) {
      console.error('Failed to initialize voice recognizer:', error);
      setSpeechSupported(false);
    }

    // Preload synthesis voices
    voiceSynthesizer.preloadVoices();

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      voiceSynthesizer.stop();
    };
  }, [detectedLanguage]);

  // Handle voice input with intent parsing
  const handleVoiceInput = async (text) => {
    const parsed = parseUserInput(text);
    setDetectedLanguage(parsed.language);
    
    // Add user message
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Process intent
    await processIntent(parsed);
  };

  // Process detected intent
  const processIntent = async (parsed) => {
    setIsLoading(true);
    
    let responseText = '';
    let shouldNavigate = false;
    let navigateTo = '';
    let autoFillData = null;

    switch (parsed.intent) {
      case INTENTS.SUBMIT_COMPLAINT:
        if (parsed.category) {
          responseText = getResponseMessage('confirmSubmit', parsed.language, { category: parsed.category });
          shouldNavigate = true;
          navigateTo = '/submit';
          autoFillData = {
            category: parsed.category,
            description: parsed.description,
            location: parsed.location,
            language: parsed.language,
            autoTriggerCamera: true
          };
        } else {
          responseText = getResponseMessage('noCategory', parsed.language);
        }
        break;
        
      case INTENTS.TRACK_COMPLAINT:
      case INTENTS.CHECK_STATUS:
        responseText = getResponseMessage('confirmTrack', parsed.language);
        shouldNavigate = true;
        navigateTo = '/track';
        break;
        
      case INTENTS.HELP:
        responseText = getResponseMessage('help', parsed.language);
        break;
        
      case INTENTS.GREETING:
        responseText = getResponseMessage('greeting', parsed.language);
        break;
        
      default:
        // Fall back to AI chat for unknown intents
        await streamChat([...messages, { role: 'user', content: parsed.text }].map(m => ({ 
          role: m.role, 
          content: m.content 
        })));
        setIsLoading(false);
        return;
    }

    // Add assistant response
    const assistantMessage = { 
      role: 'assistant', 
      content: responseText,
      isVoice: true
    };
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak response
    setIsSpeaking(true);
    await voiceSynthesizer.speak(responseText, parsed.language);
    setIsSpeaking(false);
    
    // Navigate if needed
    if (shouldNavigate && navigateTo) {
      setTimeout(() => {
        if (autoFillData) {
          sessionStorage.setItem('chatbot-auto-fill', JSON.stringify(autoFillData));
        }
        navigate(navigateTo);
        setIsOpen(false);
      }, 2000);
    }
    
    setIsLoading(false);
  };

  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (!recognizerRef.current) return;
    
    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
    } else {
      // Update language before starting
      recognizerRef.current.setLanguage(detectedLanguage);
      const started = recognizerRef.current.start();
      if (started) {
        setIsListening(true);
        setInput('');
      }
    }
  };

  const streamChat = async (userMessages, attempt = 0) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: 'Failed to connect' }));
      
      // Retry logic for specific errors
      if (resp.status === 429 || resp.status >= 500) {
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return streamChat(userMessages, attempt + 1);
        }
      }
      
      throw new Error(error.error || 'Failed to get response');
    }

    if (!resp.body) throw new Error("No response body");

    setRetryCount(0);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && last?.isStreaming) {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent, isStreaming: true }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Finalize the message
    setMessages(prev => 
      prev.map((m, i) => 
        i === prev.length - 1 && m.isStreaming ? { ...m, isStreaming: false } : m
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!isOnline) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "😔 You appear to be offline. Please check your internet connection and try again."
      }]);
      return;
    }

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Add typing indicator
      setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
      
      // Remove typing indicator and stream response
      setMessages(prev => prev.filter(m => !m.isTyping));
      await streamChat(newMessages.map(m => ({ role: m.role, content: m.content })));
    } catch (error) {
      console.error('Chat error:', error);
      setRetryCount(prev => prev + 1);
      
      const errorMessage = retryCount >= MAX_RETRIES 
        ? "I'm having trouble connecting. Please try again later or contact support directly."
        : `Sorry, something went wrong. ${error.message}. Tap retry to try again.`;
      
      setMessages(prev => [
        ...prev.filter(m => !m.isTyping),
        { 
          role: 'assistant', 
          content: errorMessage,
          isError: true,
          originalMessages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (originalMessages) => {
    setIsLoading(true);
    setMessages(prev => prev.filter(m => !m.isError));
    
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
      setMessages(prev => prev.filter(m => !m.isTyping));
      await streamChat(originalMessages);
    } catch (error) {
      console.error('Retry error:', error);
      setMessages(prev => [
        ...prev.filter(m => !m.isTyping),
        { role: 'assistant', content: "Still having trouble connecting. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAutoFillAccept = () => {
    if (extractedDetails) {
      // Store in sessionStorage for the complaint form to pick up
      sessionStorage.setItem('chatbot-complaint-details', JSON.stringify(extractedDetails));
      navigate('/submit');
      setIsOpen(false);
    }
    setShowAutoFill(false);
  };

  const handleClearHistory = () => {
    setMessages([defaultMessage]);
    setShowAutoFill(false);
    setExtractedDetails(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const quickActions = [
    { icon: FileText, label: 'Submit Complaint', action: () => { navigate('/submit'); setIsOpen(false); } },
    { icon: Search, label: 'Track Complaint', action: () => { navigate('/track'); setIsOpen(false); } },
    { icon: Phone, label: 'Contact Support', action: () => { navigate('/about'); setIsOpen(false); } },
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-md"
            >
              <span className="text-[9px] text-accent-foreground font-bold">AI</span>
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? 60 : 550
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <Bot className="w-5 h-5" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Municipal Assistant</h3>
                    {!isOnline && (
                      <WifiOff className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs opacity-80">
                    {isOnline ? 'AI-Powered Support' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors relative"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  {isMinimized && unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {/* Quick Actions */}
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {quickActions.map((action, i) => (
                        <QuickAction
                          key={i}
                          icon={action.icon}
                          label={action.label}
                          onClick={action.action}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea ref={scrollRef} className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <React.Fragment key={i}>
                          <Message {...msg} />
                          {msg.isError && msg.originalMessages && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-center"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(msg.originalMessages)}
                                disabled={isLoading}
                                className="text-xs gap-1"
                              >
                                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                Retry
                              </Button>
                            </motion.div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* Auto-fill prompt */}
                    <AnimatePresence>
                      {showAutoFill && extractedDetails && (
                        <AutoFillPrompt
                          details={extractedDetails}
                          onAccept={handleAutoFillAccept}
                          onDismiss={() => setShowAutoFill(false)}
                        />
                      )}
                    </AnimatePresence>
                  </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
                      {!isOnline && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-xs text-destructive mb-2 p-2 bg-destructive/10 rounded-lg"
                        >
                          <WifiOff className="w-3 h-3" />
                          <span>You're offline. Messages will be sent when you reconnect.</span>
                        </motion.div>
                      )}
                      
                      {/* Voice Listening Indicator */}
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-xs text-primary mb-2 p-2 bg-primary/10 rounded-lg"
                        >
                          <Mic className="w-3 h-3 animate-pulse" />
                          <span>Listening... Speak now</span>
                        </motion.div>
                      )}
                      
                      {/* Speaking Indicator */}
                      {isSpeaking && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-xs text-accent mb-2 p-2 bg-accent/10 rounded-lg"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          <span>Speaking...</span>
                        </motion.div>
                      )}
                      
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={speechSupported ? "Type or click mic to speak..." : "Type your message..."}
                          disabled={isLoading || isListening}
                          className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50"
                        />
                        
                        {/* Voice Toggle Button */}
                        {speechSupported && (
                          <Button
                            onClick={toggleVoiceListening}
                            disabled={isLoading}
                            size="icon"
                            variant={isListening ? "destructive" : "outline"}
                            className={`shrink-0 transition-all ${
                              isListening ? 'animate-pulse' : 'hover:bg-primary/10'
                            }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                          >
                            {isListening ? (
                              <MicOff className="w-4 h-4" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        
                        <Button
                          onClick={handleSend}
                          disabled={!input.trim() || isLoading || isListening}
                          size="icon"
                          className="shrink-0 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Language Indicator */}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {detectedLanguage === 'hi-IN' && '🇮🇳 हिंदी'}
                          {detectedLanguage === 'mr-IN' && '🇮🇳 मराठी'}
                          {detectedLanguage === 'en-US' && '🇺🇸 English'}
                        </span>
                        <button
                          onClick={handleClearHistory}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear conversation
                        </button>
                      </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
