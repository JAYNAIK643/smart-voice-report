import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, Volume2, Search, Navigation, Languages, 
  CheckCircle, AlertCircle, Info 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceNavigation from '@/components/voice/VoiceNavigation';
import EnhancedVoiceInput from '@/components/voice/EnhancedVoiceInput';
import VoiceSearch from '@/components/voice/VoiceSearch';
import VoiceResponse from '@/components/voice/VoiceResponse';
import { 
  isSpeechRecognitionSupported, 
  isTextToSpeechSupported 
} from '@/services/voiceService';

/**
 * Voice Features Showcase Page
 * Demonstrates all voice enhancement features
 * FOR TESTING & DEMONSTRATION PURPOSES ONLY
 */

const VoiceShowcase = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [voiceInputText, setVoiceInputText] = useState('');

  const handleSearch = (query) => {
    console.log('Voice search query:', query);
    setSearchResults([`Search result for: "${query}"`]);
  };

  const handleVoiceInput = (transcript) => {
    console.log('Voice input transcript:', transcript);
    setVoiceInputText(transcript);
  };

  const supportedFeatures = [
    {
      name: 'Speech Recognition',
      supported: isSpeechRecognitionSupported(),
      icon: Mic,
      description: 'Voice-to-text conversion for commands and input'
    },
    {
      name: 'Text-to-Speech',
      supported: isTextToSpeechSupported(),
      icon: Volume2,
      description: 'Audio feedback and status announcements'
    }
  ];

  const voiceCommands = [
    { command: 'go home', action: 'Navigate to home page', language: 'English' },
    { command: 'dashboard', action: 'Open admin dashboard', language: 'English' },
    { command: 'submit complaint', action: 'Open complaint form', language: 'English' },
    { command: 'होम पेज', action: 'Navigate to home page', language: 'Hindi' },
    { command: 'डैशबोर्ड', action: 'Open dashboard', language: 'Hindi' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Mic className="h-4 w-4" />
            <span className="text-sm font-medium">Voice Enhancement Features</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Voice-First Interface Showcase
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore the comprehensive voice capabilities integrated into the GRS platform
          </p>
        </motion.div>

        {/* Browser Support Status */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Browser Compatibility
            </CardTitle>
            <CardDescription>Voice feature support in your current browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className={`p-4 rounded-xl border ${
                    feature.supported
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <feature.icon className={`h-5 w-5 ${
                      feature.supported ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className="font-medium">{feature.name}</span>
                    {feature.supported ? (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <Badge
                    variant={feature.supported ? 'success' : 'destructive'}
                    className="mt-2"
                  >
                    {feature.supported ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Tabs */}
        <Tabs defaultValue="navigation" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          {/* Voice Navigation Tab */}
          <TabsContent value="navigation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demo Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Voice Navigation
                  </CardTitle>
                  <CardDescription>
                    Navigate through the application using voice commands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-center min-h-[100px]">
                      <VoiceNavigation />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">How to use:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click the voice navigation button</li>
                        <li>Speak a navigation command</li>
                        <li>System provides audio feedback</li>
                        <li>Navigates to the requested page</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commands Reference */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Supported Commands</CardTitle>
                  <CardDescription>Try these voice commands</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {voiceCommands.map((cmd, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                              "{cmd.command}"
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">
                              → {cmd.action}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {cmd.language}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voice Search Tab */}
          <TabsContent value="search">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Voice Search
                </CardTitle>
                <CardDescription>
                  Search for complaints and issues using natural language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Demo */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Try Voice Search:</label>
                    <VoiceSearch 
                      onSearch={handleSearch}
                      placeholder="Search by voice or text..."
                    />
                  </div>

                  {/* Results */}
                  {searchResults.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <p className="text-sm font-medium mb-2">Search Results:</p>
                      {searchResults.map((result, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {result}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Examples */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Example Queries:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'water supply problems',
                        'road repair issues',
                        'garbage collection delay',
                        'street light not working'
                      ].map((example) => (
                        <div
                          key={example}
                          className="p-2 rounded-lg bg-muted/30 text-sm text-muted-foreground"
                        >
                          💬 {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Input Tab */}
          <TabsContent value="input">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  Enhanced Voice Input
                </CardTitle>
                <CardDescription>
                  Multilingual voice input with language selection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Demo */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Voice Input with Language Support:
                    </label>
                    <EnhancedVoiceInput
                      onTranscript={handleVoiceInput}
                      placeholder="Click to speak..."
                      showLanguageSelector={true}
                    />
                  </div>

                  {/* Transcript Display */}
                  {voiceInputText && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <p className="text-sm font-medium mb-2">Transcript:</p>
                      <p className="text-foreground">{voiceInputText}</p>
                    </div>
                  )}

                  {/* Supported Languages */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
                      { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
                      { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
                      { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
                    ].map((lang) => (
                      <div
                        key={lang.code}
                        className="p-3 rounded-lg bg-muted/30 text-center"
                      >
                        <span className="text-2xl mb-1 block">{lang.flag}</span>
                        <span className="text-xs text-muted-foreground">{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Response Tab */}
          <TabsContent value="response">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Voice Response
                </CardTitle>
                <CardDescription>
                  Audio feedback for status updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Control */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <VoiceResponse />
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Audio Announcements:</p>
                    {[
                      { status: 'Pending', message: 'Complaint pending review' },
                      { status: 'In Progress', message: 'Complaint being addressed' },
                      { status: 'Resolved', message: 'Complaint resolved successfully' },
                    ].map((item) => (
                      <div
                        key={item.status}
                        className="p-3 rounded-lg bg-muted/30 flex items-center gap-3"
                      >
                        <Volume2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.status}</p>
                          <p className="text-xs text-muted-foreground">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary">
                      💡 Enable voice responses in settings to receive audio notifications
                      for complaint status changes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Notes */}
        <Card className="mt-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Zero-Regression</h4>
                <p className="text-sm text-muted-foreground">
                  All features are additive enhancements. No existing functionality was
                  modified or replaced.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Accessibility</h4>
                <p className="text-sm text-muted-foreground">
                  Multilingual support, audio feedback, visual indicators, and keyboard
                  navigation for inclusive UX.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Browser-Based</h4>
                <p className="text-sm text-muted-foreground">
                  Uses Web Speech API. No external services required. All processing
                  happens client-side.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceShowcase;
