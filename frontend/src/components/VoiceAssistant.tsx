import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Globe,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { Scheme, AssistantLanguage, AssistantMessage, NavigationTab } from '../types';
import {
  processCitizenQuery,
  SAMPLE_PROMPTS,
  prepareSpeechText,
  getBestVoice,
} from '../utils/voiceAssistantEngine';
import { useLanguage } from '../context/LanguageContext';

export interface VoiceAssistantProps {
  schemes: Scheme[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  schemes,
  onNavigate,
  onSelectSchemeForEligibility,
  isOpen,
  onToggleOpen,
  onClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isWidgetOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const { language, setLanguage, getLocalizedScheme } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevLangRef = useRef<AssistantLanguage>(language);

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    // Stop any speech when closed
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 50);
  };

  // Initial welcome message in selected language
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        language === 'ta'
          ? 'வணக்கம்! நான் SevAIQ குரல் மற்றும் உரை உதவியாளர். விவசாயி நிதி உதவி, இலவச மருத்துவ காப்பீடு, வீடு கட்ட மானியம், முதியோர் ஓய்வூதியம், அல்லது சிறு தொழில் கடன் குறித்து தமிழில் கேட்கலாம் அல்லது தட்டச்சு செய்யலாம்.'
          : language === 'hi'
          ? 'नमस्ते! मैं SevAIQ वॉइस और टेक्स्ट सहायक हूँ। किसान सम्मान निधि, मुफ्त आयुष्मान इलाज, आवास योजना, अटल पेंशन, या मुद्रा/स्वनिधि ऋण के बारे में हिंदी में बोलकर या लिखकर पूछ सकते हैं।'
          : 'Welcome! I am the SevAIQ Voice & Text Assistant. Ask questions about farming assistance, health insurance, housing subsidies, senior pensions, or business loans in simple English.',
      timestamp: new Date(),
    },
  ]);

  // Sync when language changes globally or via widget
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      // Stop any ongoing speech
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setActiveSpeakingId(null);
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }

      const greeting: AssistantMessage = {
        id: `lang-switch-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'ta'
            ? 'மொழி தமிழுக்கு மாற்றப்பட்டது. உங்கள் அரசு நலத்திட்ட கேள்விகளை தமிழில் கேட்கவும் அல்லது பேசவும்.'
            : language === 'hi'
            ? 'भाषा बदलकर हिंदी कर दी गई है। आप सरकारी कल्याणकारी योजनाओं के सवाल हिंदी में बोल या लिख सकते हैं।'
            : 'Language switched to English. You can speak or type your welfare scheme questions in simple English.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, greeting]);
    }
  }, [language, isListening]);

  // Update welcome message when language changes inside assistant
  const handleLanguageChange = (newLang: AssistantLanguage) => {
    setLanguage(newLang);
  };

  // Check speech recognition capability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Load and monitor available browser speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        const currentBest = getBestVoice(voices, language);
        if (currentBest) {
          setActiveVoiceLabel(`${currentBest.name} (${currentBest.lang})`);
        } else {
          setActiveVoiceLabel(null);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [language]);

  // Clean up any ongoing speech synthesis when unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isWidgetOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWidgetOpen]);

  // Auto-focus input when widget opens
  useEffect(() => {
    if (isWidgetOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isWidgetOpen]);

  // Global Escape key listener to close floating widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWidgetOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWidgetOpen]);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    setSpeechError(null);
    setHasInteracted(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError(
        language === 'ta'
          ? 'இந்த உலாவியில் மைக்ரோஃபோன் குரல் அறிதல் ஆதரிக்கப்படவில்லை. கீழே தட்டச்சு செய்து கேட்கலாம்.'
          : language === 'hi'
          ? 'इस ब्राउज़र में माइक्रोफोन वॉइस पहचान समर्थित नहीं है। कृपया नीचे लिखकर पूछें।'
          : 'Browser speech recognition is not supported in this browser. Please use the text input below.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendQuery(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        let errorMsg =
          language === 'ta'
            ? 'குரல் அறிதல் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.'
            : language === 'hi'
            ? 'वॉइस पहचान विफल रही। कृपया पुनः प्रयास करें या प्रश्न टाइप करें।'
            : 'Speech recognition encountered an issue. Please try again or type your question.';

        if (event.error === 'not-allowed') {
          errorMsg =
            language === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியின் அமைப்பில் மைக்ரோஃபோனை அனுமதிக்கவும் அல்லது தட்டச்சு செய்யவும்.'
              : language === 'hi'
              ? 'माइक्रोफोन की अनुमति अस्वीकृत है। ब्राउज़र सेटिंग में माइक्रोफोन की अनुमति दें अथवा लिखकर पूछें।'
              : 'Microphone permission was denied. Please allow microphone access in your browser or use text input.';
        } else if (event.error === 'no-speech') {
          errorMsg =
            language === 'ta'
              ? 'குரல் எதுவும் கேட்கவில்லை. மைக்ரோஃபோன் அருகில் பேசி முயற்சிக்கவும்.'
              : language === 'hi'
              ? 'कोई आवाज़ सुनाई नहीं दी। कृपया माइक्रोफोन के पास बोलें।'
              : 'No speech was detected. Please try speaking closer to the microphone.';
        }
        setSpeechError(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError(
        language === 'ta'
          ? 'மைக்ரோஃபோனை துவக்க முடியவில்லை. கீழே உள்ள உரை பெட்டியைப் பயன்படுத்தவும்.'
          : language === 'hi'
          ? 'माइक्रोफोन प्रारंभ नहीं हो सका। कृपया नीचे दिए गए टेक्स्ट बॉक्स का उपयोग करें।'
          : 'Could not initialize speech recognition. Please use the text input.'
      );
    }
  };

  // Text-To-Speech (TTS) handler with authentic voice selection and phonetic preparation
  const handleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (activeSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare text with phonetic Tamil/Hindi expansions for symbols, currency (ரூபாய்/रुपये), and acronyms
    const preparedText = prepareSpeechText(text, language);
    const utterance = new SpeechSynthesisUtterance(preparedText);
    utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    // Tamil & Hindi speech are most legible at 0.88-0.90 rate; English at 0.95
    utterance.rate = language === 'ta' ? 0.88 : language === 'hi' ? 0.90 : 0.95;
    utterance.pitch = 1.0;

    // Explicitly set the best native voice (e.g. Vani, Google தமிழ்) so the browser doesn't fallback to English voice
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const bestVoice = getBestVoice(voices, language);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      setActiveSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis event:', e);
      setActiveSpeakingId(null);
    };

    setActiveSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Send citizen query
  const handleSendQuery = (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query) return;

    setHasInteracted(true);

    // 1. Citizen message
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'citizen',
      text: query,
      timestamp: new Date(),
    };

    // 2. Compute response from verified scheme catalog
    const answer = processCitizenQuery(query, language, schemes);
    const botMsg: AssistantMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: answer.text,
      timestamp: new Date(),
      suggestedSchemes: answer.matchedSchemes,
      suggestedAction: answer.suggestedAction,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputText('');

    // Auto-speak answer if user spoke via mic (English only)
    if (textToSend && language === 'en' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        handleSpeak(botMsg.id, answer.text);
      }, 300);
    }
  };

  const handleResetChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'ta'
            ? 'வணக்கம்! நான் SevAIQ குரல் மற்றும் உரை உதவியாளர். விவசாயி நிதி உதவி, இலவச மருத்துவ காப்பீடு, வீடு கட்ட மானியம், முதியோர் ஓய்வூதியம், அல்லது சிறு தொழில் கடன் குறித்து தமிழில் கேட்கலாம் அல்லது தட்டச்சு செய்யலாம்.'
            : 'Welcome! I am the SevAIQ Voice & Text Assistant. Ask questions about farming assistance, health insurance, housing subsidies, senior pensions, or business loans in simple English.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Bottom-Right Corner Launcher Button */}
      <aside aria-label="Voice AI Assistant Controller">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={handleToggle}
          aria-expanded={isWidgetOpen}
          aria-haspopup="dialog"
          aria-label={
            isWidgetOpen
              ? 'Close Voice AI Assistant'
              : 'Open SevAIQ Voice AI Assistant (Tamil and English)'
          }
          className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-civic-500/40 select-none ${
            isWidgetOpen
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30 ring-2 ring-slate-700'
              : 'bg-gradient-to-r from-blue-700 via-civic-700 to-indigo-800 text-white shadow-civic-800/40 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] border border-white/25 ring-4 ring-civic-500/15'
          }`}
        >
          {/* Animated Glowing Mic Icon Badge */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-xs text-white shrink-0 group-hover:scale-110 transition-transform">
            {isWidgetOpen ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <>
                <Mic className="w-4.5 h-4.5 text-white" />
                {/* Live Online Ping Indicator */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white/80" />
                </span>
              </>
            )}
          </div>

          {/* Bilingual Label & Pill */}
          <div className="flex flex-col items-start leading-tight text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                {isWidgetOpen ? 'Close Voice' : 'Voice AI'}
              </span>
              {!isWidgetOpen && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 text-blue-100 tracking-wide">
                  தமிழ் / हिंदी / EN
                </span>
              )}
            </div>
            {!isWidgetOpen && (
              <span className="text-[10px] text-blue-100/90 font-medium whitespace-nowrap">
                Ask welfare schemes
              </span>
            )}
          </div>

          {/* Sparkle Accent */}
          {!isWidgetOpen && (
            <Sparkles className="w-3.5 h-3.5 text-amber-300 opacity-90 hidden sm:block shrink-0 animate-pulse" />
          )}
        </button>
      </aside>

      {/* Floating Bottom-Right Corner Assistant Window */}
      {isWidgetOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="SevAIQ Multilingual Voice Assistant"
          className={`fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isMaximized
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[640px] md:w-[700px] h-[86vh] max-h-[760px]'
              : 'bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[440px] h-[580px] sm:h-[620px] max-h-[calc(100vh-6.5rem)]'
          }`}
        >
          {/* Top Decorative Gradient Accent */}
          <div className="h-1 bg-gradient-to-r from-blue-700 via-civic-600 to-indigo-700 w-full shrink-0" />

          {/* Window Header: Tailored for Corner Assistant */}
          <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-white shrink-0">
            {/* Left: Branding & Status Dot */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-civic-700 to-indigo-800 text-white flex items-center justify-center shadow-xs shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-none">
                    Sev<span className="text-civic-600">AI</span>Q Voice AI
                  </span>
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">
                  {language === 'ta'
                    ? 'தமிழ் & English குரல் வழிகாட்டி'
                    : language === 'hi'
                    ? 'हिंदी, தமிழ் & English वॉइस असिस्टेंट'
                    : 'Multilingual Civic Assistant'}
                </div>
              </div>
            </div>

            {/* Right: Language Toggle, Maximize & Close Controls */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Segmented Language Selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    language === 'en'
                      ? 'bg-civic-800 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Switch language to English"
                >
                  <span>EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                    language === 'ta'
                      ? 'bg-civic-800 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Switch language to Tamil"
                >
                  <Globe className="w-3 h-3" />
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                    language === 'hi'
                      ? 'bg-civic-800 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Switch language to Hindi"
                >
                  <span>हिंदी</span>
                </button>
              </div>

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={handleResetChat}
                className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Maximize / Restore Toggle (Hidden on small mobile) */}
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="hidden sm:inline-flex w-7 h-7 items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title={isMaximized ? 'Restore compact widget' : 'Maximize window'}
                aria-label={isMaximized ? 'Restore compact widget' : 'Maximize window'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close Voice Assistant (Esc)"
                aria-label="Close Voice Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privacy & Working Reassurance Strip */}
          <div className="px-3.5 py-1.5 bg-blue-50/90 border-b border-blue-100/80 flex items-center justify-between text-[10px] text-blue-900 shrink-0">
            <div className="flex items-center space-x-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-civic-700 shrink-0" />
              <span className="font-semibold truncate">
                {language === 'ta'
                  ? 'உள்ளூர் வெப் ஸ்பீச் ஏபிஐ · கிளவுட் பதிவு இல்லை'
                  : 'Web Speech API · 100% on-device privacy'}
              </span>
            </div>
            {language === 'en' && activeVoiceLabel && (
              <span className="text-civic-800 text-[9px] font-semibold bg-blue-100 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                {activeVoiceLabel.split(' ')[0]}
              </span>
            )}
          </div>

          {/* Speech Error Banner if any */}
          {speechError && (
            <div className="p-2.5 mx-3 mt-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start space-x-2 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-tight">
                <span className="font-semibold">Notice:</span> {speechError}
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 p-0.5"
                aria-label="Dismiss error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/60 scroll-smooth">
            {messages.map((msg) => {
              const isBot = msg.sender === 'assistant';
              const isSpeaking = activeSpeakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                      isBot
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs rounded-tl-xs'
                        : 'bg-gradient-to-br from-civic-700 to-civic-800 text-white rounded-tr-xs shadow-xs font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Card Footer: Audio Speaker */}
                    {isBot && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">
                          {language === 'ta' ? 'சரிபார்க்கப்பட்ட வழிகாட்டுதல்' : 'Verified Guidance'}
                        </span>
                        {language === 'en' && (
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold transition-colors ${
                              isSpeaking
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                            aria-label={isSpeaking ? 'Stop speaking' : 'Listen to response'}
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3 h-3 text-amber-700 animate-pulse" />
                                <span>Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-civic-600" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Embedded Scheme Recommendation Cards */}
                    {msg.suggestedSchemes && msg.suggestedSchemes.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                          {language === 'ta' ? 'தொடர்புடைய அரசு திட்டங்கள்:' : 'Related Schemes:'}
                        </span>
                        <div className="space-y-1.5">
                          {msg.suggestedSchemes.map((s) => {
                            const locScheme = getLocalizedScheme(s);
                            return (
                              <div
                                key={s.id}
                                className="p-2 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 transition-colors"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block text-xs truncate">
                                    {locScheme.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 truncate block">
                                    {locScheme.category}
                                  </span>
                                </div>
                                {onSelectSchemeForEligibility && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectSchemeForEligibility(s);
                                      onNavigate('eligibility');
                                    }}
                                    className="px-2 py-1 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-colors"
                                  >
                                    <span>{language === 'ta' ? 'சரிபார்' : 'Check'}</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Action Button */}
                    {msg.suggestedAction && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onNavigate(msg.suggestedAction!.tab)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors"
                        >
                          <span>{msg.suggestedAction.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Real-time Listening Visualizer Banner (When Mic is active) */}
          {isListening && (
            <div className="mx-3 my-1.5 p-2.5 bg-gradient-to-r from-rose-50 via-rose-100/50 to-amber-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs shrink-0 animate-in fade-in">
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-rose-950 truncate">
                    {language === 'ta'
                      ? 'கேட்கிறது... தமிழில் இப்போது பேசவும்'
                      : 'Listening... speak clearly now'}
                  </div>
                  <div className="text-[10px] text-rose-700">
                    {language === 'ta'
                      ? 'பேசியதும் தானாக விடை தோன்றும்'
                      : 'Processing voice input in real-time'}
                  </div>
                </div>
              </div>

              {/* Animated Soundwave Equalizer Bars */}
              <div className="flex items-center space-x-1 shrink-0 h-5 px-2">
                <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-1" />
                <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-2" />
                <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-3" />
                <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-4" />
              </div>

              <button
                type="button"
                onClick={toggleListening}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors shadow-2xs"
              >
                Stop
              </button>
            </div>
          )}

          {/* Quick 1-Click Suggested Query Chips */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200/80 shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{language === 'ta' ? '1-கிளிக் கேள்விகள் (Quick Ask):' : 'Suggested Questions:'}</span>
              {!hasInteracted && (
                <span className="text-civic-700 font-semibold normal-case">Tap any chip to ask</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {SAMPLE_PROMPTS[language].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(sample.query);
                    handleSendQuery(sample.query);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-civic-50 hover:border-civic-300 border border-slate-200 text-slate-700 hover:text-civic-900 text-[11px] font-medium rounded-xl whitespace-nowrap transition-all shadow-2xs shrink-0 active:scale-95"
                >
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Dock Input Bar: Tactile Mic & Text Box */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center space-x-2">
              {/* Large Tactile Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/40 ring-2 ring-rose-400'
                    : speechSupported
                    ? 'bg-civic-50 hover:bg-civic-100 text-civic-700 border border-civic-200/80 shadow-2xs active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                title={
                  !speechSupported
                    ? 'Speech recognition not supported in this browser'
                    : isListening
                    ? 'Stop listening'
                    : language === 'ta'
                    ? 'குரல் மூலம் பேச மைக் அழுத்தவும்'
                    : 'Click microphone to speak'
                }
                aria-label={
                  isListening
                    ? 'Stop microphone recording'
                    : 'Start microphone speech recognition'
                }
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5 text-civic-700" />
                )}
              </button>

              {/* Text Input Field */}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  placeholder={
                    isListening
                      ? language === 'ta'
                        ? 'கேட்கிறது... தமிழில் பேசவும்...'
                        : 'Listening... speak now...'
                      : language === 'ta'
                      ? 'தமிழில் கேட்கவும் அல்லது தட்டச்சு செய்யவும்...'
                      : 'Ask welfare questions in English or Tamil...'
                  }
                  className={`w-full px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-900 placeholder-slate-400 transition-colors ${
                    isListening ? 'border-rose-400 bg-rose-50/30' : ''
                  }`}
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendQuery()}
                disabled={!inputText.trim()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-civic-700 hover:bg-civic-800 disabled:bg-slate-100 disabled:text-slate-400 text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 shadow-2xs active:scale-95"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Micro Caption */}
            <div className="text-[10px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1.5">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Speak in தமிழ் or English</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
