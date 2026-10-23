import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Globe,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  RefreshCw,
  Pause,
  Play,
  Square,
  Info,
  CheckSquare,
  ListOrdered,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Scheme, AssistantLanguage, AssistantMessage, NavigationTab, ChatMessageWire } from '../types';
import {
  SAMPLE_PROMPTS,
  prepareSpeechText,
  getBestVoice,
} from '../utils/voiceAssistantEngine';
import {
  SpeechRecognitionState,
  ClassifiedSpeechError,
  getSpeechLocale,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  classifySpeechError,
  getSpeechPrivacyNotice,
  sanitizeTranscript,
  isValidTranscript,
} from '../utils/speechUtils';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage } from '../services/api';
import { CivicMarkdown } from './CivicMarkdown';

export interface VoiceAssistantProps {
  schemes: Scheme[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
  isKioskMode?: boolean;
  isMainScreen?: boolean;
  onOpenAbout?: () => void;
  pendingQuery?: string | null;
  onClearPendingQuery?: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  schemes,
  onNavigate,
  onSelectSchemeForEligibility,
  isOpen,
  onToggleOpen,
  onClose,
  isKioskMode = false,
  isMainScreen = false,
  onOpenAbout,
  pendingQuery,
  onClearPendingQuery,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isWidgetOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const { language, setLanguage, getLocalizedScheme } = useLanguage();
  const [inputText, setInputText] = useState('');

  // Speech Recognition (STT) state machine
  const [speechState, setSpeechState] = useState<SpeechRecognitionState>('idle');
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<ClassifiedSpeechError | null>(null);

  // Text-To-Speech (TTS) playback controls state
  const [ttsState, setTtsState] = useState<{
    messageId: string | null;
    status: 'idle' | 'playing' | 'paused';
  }>({ messageId: null, status: 'idle' });
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isManuallyAbortingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevLangRef = useRef<AssistantLanguage>(language);
  const lastUserQueryRef = useRef<string>('');

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const stopAllAudio = () => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      setTtsState({ messageId: null, status: 'idle' });
    }
    if (recognitionRef.current) {
      try {
        isManuallyAbortingRef.current = true;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      setSpeechState('idle');
      setInterimTranscript('');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    stopAllAudio();
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 50);
  };

  // Initial welcome message in selected language
  const buildWelcomeMessage = (lang: AssistantLanguage): AssistantMessage => ({
    id: `welcome-${Date.now()}`,
    sender: 'assistant',
    text:
      lang === 'ta'
        ? 'வணக்கம்! நான் SevAIQ குரல் மற்றும் உரை உதவியாளர். விவசாயி நிதி உதவி, இலவச மருத்துவ காப்பீடு, வீடு கட்ட மானியம், முதியோர் ஓய்வூதியம், அல்லது சிறு தொழில் கடன் குறித்து தமிழில் கேட்கலாம் அல்லது தட்டச்சு செய்யலாம்.'
        : 'Welcome! I am the SevAIQ Voice & Text Assistant. Ask questions about farming assistance, health insurance, housing subsidies, senior pensions, or business loans in simple English.',
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    buildWelcomeMessage(language),
  ]);

  // Sync when language changes globally or via widget
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      stopAllAudio();

      const greeting: AssistantMessage = {
        id: `lang-switch-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'ta'
            ? 'மொழி தமிழுக்கு (ta-IN) மாற்றப்பட்டது. உங்கள் அரசு நலத்திட்ட கேள்விகளை தமிழில் பேசவும் அல்லது தட்டச்சு செய்யவும்.'
            : 'Language switched to English (en-IN). You can speak or type your welfare scheme questions in simple English.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, greeting]);
    }
  }, [language]);

  // Kiosk Mode Reset: clear all transcripts, context, and speech states
  useEffect(() => {
    if (isKioskMode) {
      stopAllAudio();
      setSpeechTranscript('');
      setInterimTranscript('');
      setSpeechState('idle');
      setSpeechError(null);
      setInputText('');
      setMessages([buildWelcomeMessage(language)]);
    }
  }, [isKioskMode, language]);

  // Update welcome message when language changes inside assistant
  const handleLanguageChange = (newLang: AssistantLanguage) => {
    setLanguage(newLang);
  };

  // Check speech recognition capability
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Load and monitor available browser speech synthesis voices
  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return;

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
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [language]);

  // Clean up any ongoing speech synthesis and recognition when unmounting
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isWidgetOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWidgetOpen, speechState]);

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

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT (STT) RECOGNITION HANDLERS
  // -------------------------------------------------------------
  const startListening = () => {
    setSpeechError(null);
    setHasInteracted(true);
    isManuallyAbortingRef.current = false;

    if (!isSpeechRecognitionSupported()) {
      setSpeechSupported(false);
      const unsupportedErr: ClassifiedSpeechError = {
        type: 'unsupported',
        message:
          language === 'ta'
            ? 'இந்த உலாவியில் மைக்ரோஃபோன் குரல் அறிதல் ஆதரிக்கப்படவில்லை (எ.கா. Firefox). கீழே உள்ள உரை பெட்டியில் தட்டச்சு செய்யலாம்.'
            : 'Browser speech recognition is not supported in this browser (e.g. Firefox). Manual text input is fully available below.',
        isRetryable: false,
      };
      setSpeechError(unsupportedErr);
      setSpeechState('error');
      return;
    }

    // Stop ongoing speech synthesis
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      setTtsState({ messageId: null, status: 'idle' });
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getSpeechLocale(language);

      let accumulatedFinal = '';

      recognition.onstart = () => {
        setSpeechState('listening');
        setInterimTranscript('');
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            accumulatedFinal = sanitizeTranscript(`${accumulatedFinal} ${text}`);
          } else {
            interim = sanitizeTranscript(`${interim} ${text}`);
          }
        }

        if (accumulatedFinal) {
          setSpeechTranscript(accumulatedFinal);
          setSpeechState('reviewing');
          setInterimTranscript('');
        } else if (interim) {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        if (isManuallyAbortingRef.current || event.error === 'aborted') {
          return;
        }

        const classified = classifySpeechError(event.error, language);
        setSpeechError(classified);

        if (classified.type === 'permission_denied') {
          setSpeechState('permission_denied');
        } else if (classified.type === 'no_speech') {
          if (!accumulatedFinal && !speechTranscript) {
            setSpeechState('error');
          }
        } else {
          setSpeechState('error');
        }
      };

      recognition.onend = () => {
        if (isManuallyAbortingRef.current) {
          isManuallyAbortingRef.current = false;
          return;
        }

        if (accumulatedFinal) {
          setSpeechTranscript(accumulatedFinal);
          setSpeechState('reviewing');
        } else {
          setSpeechState((prev) => (prev === 'listening' ? 'idle' : prev));
        }
      };

      recognition.start();
    } catch {
      setSpeechState('error');
      setSpeechError({
        type: 'unknown',
        message:
          language === 'ta'
            ? 'மைக்ரோஃபோனைத் துவக்க முடியவில்லை. தயவுசெய்து கீழே தட்டச்சு செய்யவும்.'
            : 'Could not initialize speech recognition. Please use the text input below.',
        isRetryable: true,
      });
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    // If interim text was captured, promote it to reviewing
    if (interimTranscript && !speechTranscript) {
      setSpeechTranscript(interimTranscript);
      setSpeechState('reviewing');
      setInterimTranscript('');
    }
  };

  const handleCancelSpeech = () => {
    isManuallyAbortingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setSpeechState('idle');
    setSpeechTranscript('');
    setInterimTranscript('');
    setSpeechError(null);
  };

  const handleRetrySpeech = () => {
    handleCancelSpeech();
    setTimeout(() => {
      startListening();
    }, 150);
  };

  const handleConfirmSpeech = () => {
    const finalQuery = speechTranscript.trim();
    if (!finalQuery || isAiLoading) return;

    // Send the user-reviewed transcript to the genuine Gemini API
    handleSendQuery(finalQuery);
    setSpeechTranscript('');
    setInterimTranscript('');
    setSpeechState('idle');
  };

  const toggleListening = () => {
    if (speechState === 'listening') {
      handleStopListening();
    } else if (speechState === 'reviewing') {
      handleRetrySpeech();
    } else {
      startListening();
    }
  };

  // -------------------------------------------------------------
  // TEXT-TO-SPEECH (TTS) PLAYBACK CONTROLS
  // -------------------------------------------------------------
  const startSpeaking = (messageId: string, text: string) => {
    if (!isSpeechSynthesisSupported()) return;

    // If currently paused on this same message, resume
    if (ttsState.messageId === messageId && ttsState.status === 'paused') {
      window.speechSynthesis.resume();
      setTtsState({ messageId, status: 'playing' });
      return;
    }

    // Cancel existing utterance before starting new one
    window.speechSynthesis.cancel();

    const preparedText = prepareSpeechText(text, language);
    const utterance = new SpeechSynthesisUtterance(preparedText);
    utterance.lang = getSpeechLocale(language);
    utterance.rate = language === 'ta' ? 0.88 : 0.95;
    utterance.pitch = 1.0;

    const voices =
      availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const bestVoice = getBestVoice(voices, language);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      setTtsState({ messageId: null, status: 'idle' });
      setLastSpokenMessageId(messageId);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis playback error:', e);
      setTtsState({ messageId: null, status: 'idle' });
    };

    utterance.onpause = () => {
      setTtsState((prev) => ({ ...prev, status: 'paused' }));
    };

    utterance.onresume = () => {
      setTtsState((prev) => ({ ...prev, status: 'playing' }));
    };

    setTtsState({ messageId, status: 'playing' });
    setLastSpokenMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeaking = () => {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.pause();
      setTtsState((prev) => ({ ...prev, status: 'paused' }));
    } catch {
      // ignore
    }
  };

  const resumeSpeaking = () => {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.resume();
      setTtsState((prev) => ({ ...prev, status: 'playing' }));
    } catch {
      // ignore
    }
  };

  const stopSpeaking = () => {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setTtsState({ messageId: null, status: 'idle' });
  };

  const replaySpeaking = (messageId: string, text: string) => {
    stopSpeaking();
    setTimeout(() => {
      startSpeaking(messageId, text);
    }, 50);
  };

  // -------------------------------------------------------------
  // SEND QUERY TO GENUINE GEMINI BACKEND API
  // -------------------------------------------------------------
  const handleSendQuery = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || isAiLoading) return;

    setHasInteracted(true);
    lastUserQueryRef.current = query;

    // 1. Citizen message
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'citizen',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    // 2. Format multi-turn conversational context for the AI provider
    // Skip static UI greetings and language switch banners so Gemini receives pure citizen-assistant dialogue
    const chatHistory: ChatMessageWire[] = messages
      .filter(
        (m) =>
          !m.isError &&
          !m.id.startsWith('welcome-') &&
          !m.id.startsWith('lang-switch-') &&
          m.text.trim().length > 0
      )
      .slice(-8)
      .map((m) => ({
        role: (m.sender === 'citizen' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));
    chatHistory.push({ role: 'user', content: query });

    try {
      const res = await sendChatMessage({
        messages: chatHistory,
        language,
      });

      setIsAiLoading(false);

      if (res.success && res.data) {
        const replyText = res.data.reply;

        // Associate verified scheme recommendation cards if mentioned by genuine AI response
        const lowerReply = replyText.toLowerCase();
        const matchedSchemes = schemes.filter(
          (s) =>
            lowerReply.includes(s.id.toLowerCase()) ||
            lowerReply.includes(s.title.toLowerCase().split('(')[0].trim().toLowerCase())
        );

        const botMsg: AssistantMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          provider: res.data.provider,
          model: res.data.model,
          latencyMs: res.data.latency_ms,
          suggestedSchemes: matchedSchemes.length > 0 ? matchedSchemes : undefined,
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Distinguish AI provider error categories
        let errorNotice =
          res.error ||
          (language === 'ta'
            ? 'AI மாதிரியிலிருந்து பதிலை உருவாக்க முடியவில்லை.'
            : 'Failed to generate response from AI model.');

        if (res.errorType === 'quota_exhausted' || res.errorType === 'rate_limited') {
          errorNotice =
            language === 'ta'
              ? 'Google Gemini சேவை வரம்பு (Quota/Rate Limit) எட்டப்பட்டுள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
              : 'Google Gemini project quota or rate limit has been reached. Please wait a few moments and retry.';
        } else if (res.errorType === 'configuration_error') {
          errorNotice =
            language === 'ta'
              ? 'சேவையகத்தில் Gemini API விசை கட்டமைக்கப்படவில்லை (GEMINI_API_KEY). தயவுசெய்து backend/.env கோப்பில் விதியைச் சேர்க்கவும்.'
              : 'Gemini API key is not configured on the backend server (GEMINI_API_KEY). Please set it in backend/.env.';
        } else if (res.errorType === 'timeout') {
          errorNotice =
            language === 'ta'
              ? 'AI பதில் நேரம் முடிந்தது (Timeout). தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
              : 'Gemini request timed out. Please retry your question.';
        } else if (res.errorType === 'auth_error') {
          errorNotice =
            language === 'ta'
              ? 'Gemini API அங்கீகார பிழை (Invalid Key). சேவையக அமைப்புகளை சரிபார்க்கவும்.'
              : 'Invalid or unauthorized Gemini API credentials. Please verify backend configuration.';
        } else if (res.errorType === 'safety_blocked') {
          errorNotice =
            language === 'ta'
              ? 'பாதுகாப்புக் கொள்கையின் காரணமாக இந்த கேள்விக்கு பதில் தடுக்கப்பட்டுள்ளது.'
              : 'This response was blocked by content safety filters.';
        }

        const errorMsg: AssistantMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: errorNotice,
          timestamp: new Date(),
          isError: true,
          errorType: res.errorType,
          retryable: res.retryable,
        };

        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      setIsAiLoading(false);
      const networkErr: AssistantMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'ta'
            ? 'பிணைய பிழை: AI சேவையகத்துடன் இணைக்க முடியவில்லை. இணைய இணைப்பை சரிபார்க்கவும்.'
            : 'Network error: could not connect to the backend AI service. Please check your connection.',
        timestamp: new Date(),
        isError: true,
        errorType: 'network_error',
        retryable: true,
      };
      setMessages((prev) => [...prev, networkErr]);
    }
  };

  const handleRetryLastQuery = () => {
    if (lastUserQueryRef.current && !isAiLoading) {
      handleSendQuery(lastUserQueryRef.current);
    }
  };

  // Auto-send or prefill query when passed externally (e.g. from Scheme cards)
  useEffect(() => {
    if (pendingQuery && pendingQuery.trim()) {
      const q = pendingQuery.trim();
      onClearPendingQuery?.();
      handleSendQuery(q);
    }
  }, [pendingQuery, onClearPendingQuery]);

  const handleResetChat = () => {
    stopAllAudio();
    setSpeechTranscript('');
    setInterimTranscript('');
    setSpeechState('idle');
    setSpeechError(null);
    setInputText('');
    setMessages([buildWelcomeMessage(language)]);
  };

  const privacyNotice = getSpeechPrivacyNotice(language);

  const renderChatContent = () => (
    <>
      {/* Top Decorative Gradient Accent */}
      <div className="h-1 bg-gradient-to-r from-blue-700 via-civic-600 to-indigo-700 w-full shrink-0" />

      {/* Window / Workspace Header */}
      <div className="p-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-[#0b162f] shrink-0">
        {/* Left: Branding & Status Dot */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-civic-700 to-indigo-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Sev<span className="text-civic-600">AI</span>Q Voice AI
              </span>
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 leading-none shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate leading-tight mt-0.5">
              {language === 'ta'
                ? 'தமிழ் (ta-IN) & English (en-IN) குரல் வழிகாட்டி'
                : 'Bilingual Civic Assistant (ta-IN / en-IN)'}
            </div>
          </div>
        </div>

        {/* Right: Segmented Language Selector & Window Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Distinct BCP 47 Language Selector */}
          <div
            className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
            role="group"
            aria-label="Speech and language selector"
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('ta')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                language === 'ta'
                  ? 'bg-civic-800 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Switch to Tamil (ta-IN)"
              aria-pressed={language === 'ta'}
              data-testid="lang-select-ta"
            >
              <Globe className="w-3 h-3" />
              <span>தமிழ் (ta-IN)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                language === 'en'
                  ? 'bg-civic-800 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Switch to English (en-IN)"
              aria-pressed={language === 'en'}
              data-testid="lang-select-en"
            >
              <span>English (en-IN)</span>
            </button>
          </div>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={handleResetChat}
            className="w-7 h-7 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* About SevAIQ Shortcut button (shown on main screen if onOpenAbout provided) */}
          {isMainScreen && onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="w-7 h-7 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="About SevAIQ"
              aria-label="About SevAIQ"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Maximize / Restore Toggle (only when NOT main screen) */}
          {!isMainScreen && (
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex w-7 h-7 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isMaximized ? 'Restore compact widget' : 'Maximize window'}
              aria-label={isMaximized ? 'Restore compact widget' : 'Maximize window'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Close Button (only when NOT main screen) */}
          {!isMainScreen && (
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Voice Assistant (Esc)"
              aria-label="Close Voice Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Truthful Privacy Disclosure Strip (No false 'local on-device' claim) */}
      <div className="px-3.5 py-1.5 bg-blue-50/90 border-b border-blue-100/80 flex items-center justify-between text-[10px] text-blue-900 shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-civic-700 shrink-0" />
          <span className="font-semibold truncate" title={privacyNotice.detailed}>
            {privacyNotice.badge}
          </span>
        </div>
        {activeVoiceLabel && (
          <span className="text-civic-800 text-[9px] font-semibold bg-blue-100 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
            {activeVoiceLabel.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Microphone Permission Denied Banner */}
      {speechState === 'permission_denied' && (
        <div
          className="mx-3 mt-2 p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-2.5 text-amber-950 shrink-0 animate-in fade-in"
          data-testid="speech-permission-denied-banner"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">
              {language === 'ta' ? 'மைக்ரோஃபோன் அனுமதி தேவை' : 'Microphone Permission Needed'}
            </div>
            <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
              {speechError?.message ||
                (language === 'ta'
                  ? 'உலாவி அமைப்பில் மைக்ரோஃபோனை அனுமதிக்கவும் அல்லது கீழே உள்ள உரை பெட்டியில் தட்டச்சு செய்யவும்.'
                  : 'Please allow microphone access in your browser or use the manual text input below.')}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <button
                type="button"
                onClick={startListening}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs cursor-pointer"
              >
                {language === 'ta' ? 'மீண்டும் அனுமதி கேட்கவும்' : 'Retry Permission'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeechState('idle');
                  setSpeechError(null);
                }}
                className="px-2 py-1 text-amber-800 hover:text-amber-950 text-[10px] font-semibold cursor-pointer"
              >
                {language === 'ta' ? 'மூடு' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Speech Error Banner (Non-permission) */}
      {speechState === 'error' && speechError && (
        <div
          className="mx-3 mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start space-x-2 shrink-0 animate-in fade-in"
          data-testid="speech-error-banner"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-tight">
            <span className="font-semibold">{language === 'ta' ? 'அறிவிப்பு:' : 'Notice:'}</span>{' '}
            {speechError.message}
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {speechError.isRetryable && (
              <button
                type="button"
                onClick={startListening}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
              >
                {language === 'ta' ? 'மீண்டும் முயற்சி' : 'Retry'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSpeechState('idle');
                setSpeechError(null);
              }}
              className="text-amber-700 hover:text-amber-900 p-0.5 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/60 dark:bg-[#070e22]/80 scroll-smooth">
        {/* Welcoming Starter Experience with Large Suggested Question Cards */}
        {messages.length <= 1 && (
          <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 dark:from-[#0d1a38] dark:via-[#0c1834] dark:to-[#081228] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-2xs space-y-6 my-1 animate-in fade-in">
            {/* Greeting Header */}
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-civic-700 to-indigo-900 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'ta'
                      ? 'இன்று SevAIQ உங்களுக்கு எவ்வாறு உதவ முடியும்?'
                      : language === 'hi'
                      ? 'आज SevAIQ आपकी क्या मदद कर सकता है?'
                      : 'How can SevAIQ help you today?'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200">
                    {language === 'ta' ? 'அதிகாரப்பூர்வ அரசு வழிகாட்டுதல்' : language === 'hi' ? 'आधिकारिक सरकारी मार्गदर्शन' : 'Verified Official Guidance'}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {language === 'ta'
                    ? 'விவசாயி நிதி உதவி, மருத்துவ காப்பீடு, வீடு கட்ட மானியம், ஓய்வூதியம், மற்றும் கல்வி உதவித்தொகை குறித்த உங்கள் உரிமைகளை எளிதாக அறியலாம்.'
                    : language === 'hi'
                    ? 'किसान सहायता, स्वास्थ्य बीमा, आवास सब्सिडी, पेंशन और छात्रवृत्ति से संबंधित अपने अधिकारों को सरलता से जानें।'
                    : 'Discover central and state welfare benefits, check if you qualify, prepare required documents, and track applications in simple language.'}
                </p>
              </div>
            </div>

            {/* Two Primary Action CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Primary CTA 1: Find Government Schemes for Me */}
              <button
                type="button"
                onClick={() => onNavigate('eligibility')}
                className="group relative p-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start justify-between space-x-3 cursor-pointer border border-emerald-500/30"
              >
                <div className="space-y-1 flex-1">
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                    <span>
                      {language === 'ta' ? 'படி 1: பரிந்துரைக்கப்பட்டது' : language === 'hi' ? 'चरण 1: अनुशंसित' : 'Step 1: Recommended'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center space-x-1.5">
                    <span>
                      {language === 'ta'
                        ? 'எனக்கான அரசு திட்டங்களை கண்டறியவும்'
                        : language === 'hi'
                        ? 'मेरे लिए सरकारी योजनाएं खोजें'
                        : 'Find Government Schemes for Me'}
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-snug">
                    {language === 'ta'
                      ? 'எளிய 4 கேள்விகளுக்கு பதிலளித்து, உங்களுக்கு பொருந்தக்கூடிய திட்டங்களை உடனடியாகக் காண்க (2 நிமிடங்கள்).'
                      : language === 'hi'
                      ? 'सरल 4 प्रश्नों के उत्तर दें और अपने लिए उपयुक्त योजनाएं तुरंत देखें (2 मिनट)।'
                      : 'Answer 4 simple questions to see which welfare schemes match your needs in 2 minutes.'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Primary CTA 2: Ask SevAIQ a Question */}
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative p-4 bg-white dark:bg-[#0f2146] hover:bg-civic-50/60 dark:hover:bg-[#142a59] text-slate-900 dark:text-white rounded-2xl border-2 border-civic-300 dark:border-civic-600 shadow-2xs hover:shadow-xs transition-all text-left flex items-start justify-between space-x-3 cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-civic-100 dark:bg-civic-950/80 text-civic-800 dark:text-civic-300">
                    <MessageSquare className="w-3 h-3 text-civic-600" />
                    <span>
                      {language === 'ta' ? 'குரல் & உரை AI' : language === 'hi' ? 'आवाज और टेक्स्ट AI' : 'Voice & Text AI'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {language === 'ta'
                      ? 'SevAIQ-விடம் நேரடியாக கேட்கவும்'
                      : language === 'hi'
                      ? 'SevAIQ से सीधे प्रश्न पूछें'
                      : 'Ask SevAIQ a Question'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-300 leading-snug">
                    {language === 'ta'
                      ? 'தமிழில் அல்லது ஆங்கிலத்தில் மைக் மூலம் பேசலாம் அல்லது தட்டச்சு செய்யலாம்.'
                      : language === 'hi'
                      ? 'हिंदी या अंग्रेजी में माइक से बोलें या नीचे प्रश्न टाइप करें।'
                      : 'Speak via microphone or type your question in English or தமிழ்.'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-civic-100 dark:bg-civic-900/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-civic-700 dark:text-civic-300">
                  <Mic className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* 4-Stage Citizen Journey Visual Roadmap */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'ta' ? 'குடிமக்கள் 4-படி பயணம்:' : language === 'hi' ? 'नागरिक 4-चरणीय यात्रा:' : '4-Stage Citizen Journey:'}
                </span>
                <span className="text-[10px] text-civic-700 dark:text-civic-400 font-semibold">
                  {language === 'ta' ? 'நேரடியாக செல்ல எந்த படியையும் தொடவும்' : 'Tap any step to jump'}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => onNavigate('eligibility')}
                  className="p-3 bg-white dark:bg-[#0c1834] hover:bg-civic-50/60 dark:hover:bg-[#12244c] rounded-xl border border-slate-200/90 dark:border-slate-800 text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-civic-700 dark:text-civic-400">1</span>
                    <CheckSquare className="w-3.5 h-3.5 text-civic-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-civic-700 transition-colors">
                    {language === 'ta' ? '1. உங்கள் விவரங்கள்' : language === 'hi' ? '1. आपकी जानकारी' : '1. Your Details'}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {language === 'ta' ? '2 நிமிட சுயவிவரம்' : 'Quick eligibility check'}
                  </p>
                </button>

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => onNavigate('discover')}
                  className="p-3 bg-white dark:bg-[#0c1834] hover:bg-civic-50/60 dark:hover:bg-[#12244c] rounded-xl border border-slate-200/90 dark:border-slate-800 text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-civic-700 dark:text-civic-400">2</span>
                    <Sparkles className="w-3.5 h-3.5 text-civic-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-civic-700 transition-colors">
                    {language === 'ta' ? '2. திட்டங்களை தேடவும்' : language === 'hi' ? '2. योजनाएं खोजें' : '2. Find Schemes'}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {language === 'ta' ? 'பொருந்தும் நலத்திட்டங்கள்' : 'Personalized matches'}
                  </p>
                </button>

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => onNavigate('document-mapper')}
                  className="p-3 bg-white dark:bg-[#0c1834] hover:bg-civic-50/60 dark:hover:bg-[#12244c] rounded-xl border border-slate-200/90 dark:border-slate-800 text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-civic-700 dark:text-civic-400">3</span>
                    <FileText className="w-3.5 h-3.5 text-civic-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-civic-700 transition-colors">
                    {language === 'ta' ? '3. ஆவணங்கள் தயார்' : language === 'hi' ? '3. दस्तावेज़ तैयारी' : '3. Prepare Docs'}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {language === 'ta' ? 'சரிபார்ப்பு பட்டியல்' : 'Checklist & Kendra guidance'}
                  </p>
                </button>

                {/* Step 4 */}
                <button
                  type="button"
                  onClick={() => onNavigate('application-tracker')}
                  className="p-3 bg-white dark:bg-[#0c1834] hover:bg-civic-50/60 dark:hover:bg-[#12244c] rounded-xl border border-slate-200/90 dark:border-slate-800 text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-civic-700 dark:text-civic-400">4</span>
                    <ListOrdered className="w-3.5 h-3.5 text-civic-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-civic-700 transition-colors">
                    {language === 'ta' ? '4. விண்ணப்ப நிலை' : language === 'hi' ? '4. आवेदन स्थिति' : '4. Track Application'}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {language === 'ta' ? 'அதிகாரப்பூர்வ இணைப்புகள்' : 'Official links & reminders'}
                  </p>
                </button>
              </div>
            </div>

            {/* Suggested 1-Click Questions */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>
                  {language === 'ta'
                    ? 'பரிந்துரைக்கப்பட்ட கேள்விகள் (1-கிளிக்):'
                    : 'Suggested Questions (1-Click Ask):'}
                </span>
                <span className="text-[10px] text-civic-700 dark:text-civic-400 font-semibold normal-case">
                  {language === 'ta' ? 'கார்டை கிளிக் செய்து கேட்கலாம்' : 'Tap any card to ask'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SAMPLE_PROMPTS[language].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(prompt.query);
                      handleSendQuery(prompt.query);
                    }}
                    disabled={isAiLoading}
                    className="group p-3 bg-white dark:bg-[#0d1c3a] hover:bg-civic-50/80 dark:hover:bg-[#13274e] active:bg-civic-100/60 dark:active:bg-[#183060] rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:border-civic-300 dark:hover:border-civic-500 text-left transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base sm:text-lg leading-none shrink-0">{prompt.icon || '📌'}</span>
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-civic-800 dark:group-hover:text-civic-300 transition-colors line-clamp-1">
                        {prompt.label}
                      </span>
                    </div>
                    {prompt.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 line-clamp-2 leading-snug">
                        {prompt.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-1 text-[10px] font-semibold text-civic-700 dark:text-civic-400 group-hover:text-civic-900 dark:group-hover:text-civic-200 mt-0.5">
                      <span>{language === 'ta' ? 'கேட்க கிளிக் செய்க' : 'Click to ask'}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  isBot
                    ? msg.isError
                      ? 'bg-amber-50/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs rounded-tl-xs'
                      : 'bg-white dark:bg-[#0e1c3b] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs rounded-tl-xs'
                    : 'bg-gradient-to-br from-civic-700 to-civic-800 text-white rounded-tr-xs shadow-xs font-medium'
                }`}
              >
                {isBot ? (
                  msg.isError ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                  ) : (
                    <CivicMarkdown content={msg.text} />
                  )
                ) : (
                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                )}

                {/* Retry button for retryable provider errors */}
                {isBot && msg.isError && msg.retryable && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between">
                    <span className="text-[10px] text-amber-700 font-medium">
                      {language === 'ta' ? 'மீண்டும் முயற்சிக்கலாம்' : 'Retry available'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRetryLastQuery}
                      disabled={isAiLoading}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[10px] shadow-2xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>{language === 'ta' ? 'மீண்டும் முயற்சி' : 'Retry Query'}</span>
                    </button>
                  </div>
                )}

                {/* Card Footer: AI Attribution & Audio Speaker Controls */}
                {isBot && !msg.isError && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <span className="inline-flex items-center space-x-1 font-bold text-civic-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        <Sparkles className="w-2.5 h-2.5 text-civic-600" />
                        <span>
                          {msg.provider ? `AI • ${msg.provider.toUpperCase()}` : 'AI • GEMINI'}
                        </span>
                      </span>
                      {msg.latencyMs && (
                        <span className="text-slate-400 font-mono text-[9px] hidden sm:inline">
                          {msg.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {/* TTS Audio Controls: Listen, Pause, Resume, Stop, Replay */}
                    <div className="flex items-center space-x-1">
                      {ttsState.messageId === msg.id && ttsState.status === 'playing' ? (
                        <>
                          <button
                            type="button"
                            onClick={pauseSpeaking}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                            title="Pause audio"
                            aria-label="Pause audio"
                          >
                            <Pause className="w-3 h-3 text-amber-800" />
                            <span>{language === 'ta' ? 'இடைநிறுத்து' : 'Pause'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopSpeaking}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                            title="Stop audio"
                            aria-label="Stop audio"
                          >
                            <Square className="w-2.5 h-2.5 text-slate-700 fill-current" />
                            <span>{language === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                          </button>
                        </>
                      ) : ttsState.messageId === msg.id && ttsState.status === 'paused' ? (
                        <>
                          <button
                            type="button"
                            onClick={resumeSpeaking}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                            title="Resume audio"
                            aria-label="Resume audio"
                          >
                            <Play className="w-3 h-3 text-emerald-800 fill-current" />
                            <span>{language === 'ta' ? 'தொடர' : 'Resume'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopSpeaking}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                            title="Stop audio"
                            aria-label="Stop audio"
                          >
                            <Square className="w-2.5 h-2.5 text-slate-700 fill-current" />
                            <span>{language === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startSpeaking(msg.id, msg.text)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                            aria-label="Listen to response"
                          >
                            <Volume2 className="w-3 h-3 text-civic-600" />
                            <span>{language === 'ta' ? 'கேளுங்கள்' : 'Listen'}</span>
                          </button>
                          {lastSpokenMessageId === msg.id && (
                            <button
                              type="button"
                              onClick={() => replaySpeaking(msg.id, msg.text)}
                              className="inline-flex items-center p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Replay audio"
                              aria-label="Replay audio"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
                                className="px-2 py-1 bg-civic-600 hover:bg-civic-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-colors cursor-pointer"
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
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
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

        {/* Genuine AI Model Thinking State Indicator */}
        {isAiLoading && (
          <div className="flex flex-col items-start space-y-1 animate-in fade-in">
            <div className="p-3 bg-white text-slate-700 border border-slate-200/90 shadow-2xs rounded-2xl rounded-tl-xs flex items-center space-x-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-civic-600 animate-spin" />
              <span className="font-semibold text-slate-700">
                {language === 'ta'
                  ? 'Gemini AI திட்டங்களை ஆராய்கிறது...'
                  : 'Gemini AI is analyzing schemes...'}
              </span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-civic-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-civic-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-civic-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* REAL-TIME LISTENING VISUALIZER BANNER */}
      {speechState === 'listening' && (
        <div
          className="mx-3 my-1.5 p-2.5 bg-gradient-to-r from-rose-50 via-rose-100/50 to-amber-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs shrink-0 animate-in fade-in"
          data-testid="speech-listening-banner"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-rose-950 truncate flex items-center space-x-1.5">
                <span>
                  {language === 'ta'
                    ? 'கேட்கிறது... தமிழில் இப்போது பேசவும்'
                    : 'Listening... speak clearly now'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-200/70 text-rose-900">
                  {getSpeechLocale(language)}
                </span>
              </div>
              <div className="text-[10px] text-rose-700 truncate">
                {interimTranscript
                  ? `"${interimTranscript}..."`
                  : language === 'ta'
                  ? 'பேசி முடித்ததும் சரிபார்க்கலாம்'
                  : 'Review transcript before sending'}
              </div>
            </div>
          </div>

          {/* Animated Soundwave Equalizer Bars */}
          <div className="flex items-center space-x-1 shrink-0 h-5 px-1">
            <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-1" />
            <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-2" />
            <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-3" />
            <span className="w-1 bg-rose-600 rounded-full animate-voice-wave-4" />
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleStopListening}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
              aria-label="Stop recording"
            >
              {language === 'ta' ? 'நிறுத்து' : 'Stop'}
            </button>
            <button
              type="button"
              onClick={handleCancelSpeech}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
              aria-label="Cancel recording"
            >
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* EDITABLE TRANSCRIPT REVIEW & CONFIRMATION BOX */}
      {speechState === 'reviewing' && (
        <div
          className="mx-3 my-2 p-3 bg-blue-50/90 border border-blue-200/90 rounded-2xl shadow-xs space-y-2 shrink-0 animate-in fade-in"
          data-testid="speech-review-container"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-civic-700" />
              <span>
                {language === 'ta' ? 'குரல் உரை சரிபார்ப்பு' : 'Review Voice Transcript'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {getSpeechLocale(language)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal">
              {language === 'ta' ? 'அனுப்பும் முன் திருத்தலாம்' : 'Editable before send'}
            </span>
          </div>

          <textarea
            value={speechTranscript}
            onChange={(e) => setSpeechTranscript(e.target.value)}
            rows={2}
            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-900 resize-none font-medium leading-relaxed"
            placeholder={
              language === 'ta'
                ? 'குரல் உரை இங்கே தோன்றும்... ஏதேனும் திருத்தங்கள் இருந்தால் மாற்றவும்'
                : 'Your voice transcript appears here. You can edit before sending...'
            }
            aria-label="Editable voice transcript"
            data-testid="speech-transcript-input"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleRetrySpeech}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                aria-label="Speak again"
              >
                <RotateCcw className="w-3 h-3 text-slate-600" />
                <span>{language === 'ta' ? 'மீண்டும் பேச' : 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelSpeech}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Discard voice transcript"
              >
                <span>{language === 'ta' ? 'ரத்து' : 'Cancel'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmSpeech}
              disabled={!isValidTranscript(speechTranscript) || isAiLoading}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-civic-700 hover:bg-civic-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              aria-label="Confirm and send transcript to Gemini"
              data-testid="speech-confirm-send-button"
            >
              <Send className="w-3 h-3" />
              <span>
                {language === 'ta'
                  ? 'உறுதிசெய்து Gemini-க்கு அனுப்பு'
                  : 'Confirm & Send to Gemini'}
              </span>
            </button>
          </div>

          <p className="text-[9px] text-slate-500 leading-tight">
            {language === 'ta'
              ? 'தனியுரிமை: உறுதிசெய்த உரை மட்டுமே Gemini AI-க்கு அனுப்பப்படும். ஆடியோ பதிவு செய்யப்படாது.'
              : 'Privacy: Only this confirmed text is sent to Gemini AI. No voice audio is stored by SevAIQ.'}
          </p>
        </div>
      )}

      {/* Quick 1-Click Suggested Query Chips */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-[#091329] border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>{language === 'ta' ? '1-கிளிக் கேள்விகள் (Quick Ask):' : 'Suggested Questions:'}</span>
          {!hasInteracted && (
            <span className="text-civic-700 dark:text-civic-400 font-semibold normal-case">Tap any chip to ask</span>
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
              className="px-2.5 py-1 bg-white dark:bg-[#0e1d3d] hover:bg-civic-50 dark:hover:bg-[#162a52] hover:border-civic-300 dark:hover:border-civic-500 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-civic-900 dark:hover:text-civic-300 text-[11px] font-medium rounded-xl whitespace-nowrap transition-all shadow-2xs shrink-0 active:scale-95 cursor-pointer"
            >
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Dock Input Bar: Tactile Mic & Text Box */}
      <div className="p-3 sm:p-4 bg-white dark:bg-[#0b162f] border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Large Tactile Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 cursor-pointer ${
              speechState === 'listening'
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/40 ring-2 ring-rose-400'
                : speechState === 'reviewing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300'
                : speechSupported
                ? 'bg-civic-50 dark:bg-civic-950/70 hover:bg-civic-100 dark:hover:bg-civic-900 text-civic-700 dark:text-civic-300 border border-civic-200/80 dark:border-civic-800 shadow-2xs active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
            title={
              !speechSupported
                ? 'Speech recognition not supported in this browser (Firefox). Text input is available.'
                : speechState === 'listening'
                ? 'Stop listening'
                : speechState === 'reviewing'
                ? 'Speak again (Retry)'
                : language === 'ta'
                ? 'குரல் மூலம் பேச மைக் அழுத்தவும் (ta-IN)'
                : 'Click microphone to speak (en-IN)'
            }
            aria-label={
              speechState === 'listening'
                ? 'Stop microphone recording'
                : speechState === 'reviewing'
                ? 'Retry microphone recording'
                : 'Start microphone speech recognition'
            }
            data-testid="microphone-toggle-button"
          >
            {speechState === 'listening' ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-civic-700 dark:text-civic-300" />
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
              disabled={isAiLoading}
              placeholder={
                isAiLoading
                  ? language === 'ta'
                    ? 'Gemini AI பதிலளிக்கிறது...'
                    : 'Gemini AI is generating response...'
                  : speechState === 'listening'
                  ? language === 'ta'
                    ? 'கேட்கிறது... தமிழில் பேசவும்...'
                    : 'Listening... speak now...'
                  : language === 'ta'
                  ? 'தமிழில் கேட்கவும் அல்லது தட்டச்சு செய்யவும்...'
                  : 'Ask welfare questions in English or Tamil...'
              }
              className={`w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-slate-50 dark:bg-[#070e22] border border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-[#0a142c] focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl transition-colors ${
                speechState === 'listening' ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30' : ''
              } ${isAiLoading ? 'opacity-70 cursor-wait' : ''}`}
            />
            {inputText && !isAiLoading && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
            disabled={!inputText.trim() || isAiLoading}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-civic-700 hover:bg-civic-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send query"
          >
            {isAiLoading ? (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-civic-300" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>

        {/* Micro Caption */}
        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5">
          <span>Press Enter to send</span>
          <span>•</span>
          <span>Speak in தமிழ் (ta-IN) or English (en-IN)</span>
        </div>
      </div>
    </>
  );

  // 1. Primary Full Main Screen Citizen Workspace Layout
  if (isMainScreen) {
    return (
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 flex flex-col flex-1">
        <section
          role="region"
          aria-label="SevAIQ Tamil & English Voice Assistant"
          className="bg-white dark:bg-[#0b162f] rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800/80 flex flex-col flex-1 min-h-[580px] sm:min-h-[640px] h-[calc(100vh-8.5rem)] max-h-[920px] overflow-hidden"
        >
          {renderChatContent()}
        </section>
      </div>
    );
  }

  // 2. Secondary Pages Floating Launcher and Window Layout
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
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 text-blue-100 tracking-wide font-mono">
                  ta-IN / en-IN
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
          aria-label="SevAIQ Tamil & English Voice Assistant"
          className={`fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isMaximized
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[640px] md:w-[700px] h-[86vh] max-h-[760px]'
              : 'bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[600px] sm:h-[640px] max-h-[calc(100vh-6.5rem)]'
          }`}
        >
          {renderChatContent()}
        </section>
      )}
    </>
  );
};
