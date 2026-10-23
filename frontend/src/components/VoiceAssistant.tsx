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
} from 'lucide-react';
import { Scheme, AssistantLanguage, AssistantMessage, NavigationTab } from '../types';
import { processCitizenQuery, SAMPLE_PROMPTS } from '../utils/voiceAssistantEngine';

interface VoiceAssistantProps {
  schemes: Scheme[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectSchemeForEligibility?: (scheme: Scheme) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  schemes,
  onNavigate,
  onSelectSchemeForEligibility,
}) => {
  const [language, setLanguage] = useState<AssistantLanguage>('ta');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initial welcome message in selected language
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        'வணக்கம்! நான் SevAIQ குரல் மற்றும் உரை உதவியாளர். விவசாயி நிதி உதவி, இலவச மருத்துவ காப்பீடு, வீடு கட்ட மானியம், முதியோர் ஓய்வூதியம், அல்லது சிறு தொழில் கடன் குறித்து தமிழில் கேட்கலாம் அல்லது கீழே தட்டச்சு செய்யலாம்.',
      timestamp: new Date(),
    },
  ]);

  // Update welcome message when language changes
  const handleLanguageChange = (newLang: AssistantLanguage) => {
    setLanguage(newLang);
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
        newLang === 'ta'
          ? 'மொழி தமிழுக்கு மாற்றப்பட்டது. உங்கள் அரசு நலத்திட்ட கேள்விகளை தமிழில் கேட்கவும் அல்லது பேசவும்.'
          : 'Language switched to English. You can speak or type your welfare scheme questions in simple English.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, greeting]);
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    setSpeechError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError(
        language === 'ta'
          ? 'இந்த உலாவியில் மைக்ரோஃபோன் குரல் அறிதல் ஆதரிக்கப்படவில்லை. கீழே தட்டச்சு செய்து கேட்கலாம்.'
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
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

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
            : 'Speech recognition encountered an issue. Please try again or type your question.';

        if (event.error === 'not-allowed') {
          errorMsg =
            language === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியின் அமைப்பில் மைக்ரோஃபோனை அனுமதிக்கவும் அல்லது தட்டச்சு செய்யவும்.'
              : 'Microphone permission was denied. Please allow microphone access in your browser or use text input.';
        } else if (event.error === 'no-speech') {
          errorMsg =
            language === 'ta'
              ? 'குரல் எதுவும் கேட்கவில்லை. மைக்ரோஃபோன் அருகில் பேசி முயற்சிக்கவும்.'
              : 'No speech was detected. Please try speaking closer to the microphone.';
        }
        setSpeechError(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      setSpeechError(
        language === 'ta'
          ? 'மைக்ரோஃபோனை துவக்க முடியவில்லை. கீழே உள்ள உரை பெட்டியைப் பயன்படுத்தவும்.'
          : 'Could not initialize speech recognition. Please use the text input.'
      );
    }
  };

  // Text-To-Speech (TTS) handler
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setActiveSpeakingId(null);
    };

    utterance.onerror = () => {
      setActiveSpeakingId(null);
    };

    setActiveSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Send citizen query
  const handleSendQuery = (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query) return;

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

    // Auto-speak answer if user spoke via mic
    if (textToSend && typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
            ? 'வணக்கம்! நான் SevAIQ குரல் மற்றும் உரை உதவியாளர். விவசாயி நிதி உதவி, இலவச மருத்துவ காப்பீடு, வீடு கட்ட மானியம், முதியோர் ஓய்வூதியம், அல்லது சிறு தொழில் கடன் குறித்து தமிழில் கேட்கலாம் அல்லது கீழே தட்டச்சு செய்யலாம்.'
            : 'Welcome! I am the SevAIQ Voice & Text Assistant. Ask questions about farming assistance, health insurance, housing subsidies, senior pensions, or business loans in simple English.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-civic-700 mb-1">
            <Mic className="w-4 h-4" />
            <span>Voice & Language Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tamil & English Voice Assistant
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ask welfare questions in everyday Tamil or English using voice or text.
          </p>
        </div>

        {/* Visible Language Selector */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleLanguageChange('ta')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                language === 'ta'
                  ? 'bg-civic-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              aria-label="Switch language to Tamil"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>தமிழ் (Tamil)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                language === 'en'
                  ? 'bg-civic-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              aria-label="Switch language to English"
            >
              <span>English</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Honest AI & Privacy Disclosure Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-civic-900 block">
            Privacy Guarantee & Working Capabilities:
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            {language === 'ta' ? (
              <>
                SevAIQ குரல் உதவியாளர் உங்களின் உலாவியில் உள்ள உள்ளூர் வெப் ஸ்பீச் ஏபிஐ (Web Speech API) மூலம் செயல்படுகிறது. உங்களின் குரல் பதிவு அல்லது தனிப்பட்ட தகவல்கள் எந்த மூன்றாம் தரப்பு AI சர்வர்களுக்கும் அனுப்பப்படுவதில்லை. அனைத்து பதில்களும் சரிபார்க்கப்பட்ட அரசு வழிகாட்டுதல்களிலிருந்து மட்டுமே வழங்கப்படுகின்றன.
              </>
            ) : (
              <>
                SevAIQ Voice Assistant processes queries locally using standard in-browser Web Speech APIs. No citizen voice recordings or personal queries are transmitted to third-party AI cloud providers. Answers are synthesized exclusively from verified official government scheme data in SevAIQ.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Speech Error Banner if any */}
      {speechError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Voice Notice:</span> {speechError}
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="text-amber-700 hover:text-amber-900 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Thread Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            const isSpeaking = activeSpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-sm'
                      : 'bg-civic-700 text-white rounded-tr-sm shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Audio Speaker Button for Assistant Responses */}
                  {isBot && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Verified Guidance</span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          isSpeaking
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        aria-label={isSpeaking ? 'Stop speaking' : 'Listen to response'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-civic-600" />
                            <span>Listen (ஒலி வடிவில் கேட்க)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Suggested Scheme Cards attached to response */}
                  {msg.suggestedSchemes && msg.suggestedSchemes.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-2">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block">
                        Related Government Schemes:
                      </span>
                      <div className="space-y-1.5">
                        {msg.suggestedSchemes.map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {s.title}
                              </span>
                              <span className="text-[10px] text-slate-500">{s.category}</span>
                            </div>
                            {onSelectSchemeForEligibility && (
                              <button
                                type="button"
                                onClick={() => onSelectSchemeForEligibility(s)}
                                className="px-2.5 py-1 bg-civic-50 hover:bg-civic-100 text-civic-800 rounded-lg text-[11px] font-semibold flex items-center space-x-1 shrink-0 self-start sm:self-auto"
                              >
                                <span>Check Eligibility</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Quick Action */}
                  {msg.suggestedAction && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => onNavigate(msg.suggestedAction!.tab)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Prompts */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {language === 'ta' ? 'மாதிரி கேள்விகள் (1-Click Ask):' : 'Suggested Questions (1-Click Ask):'}
          </span>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {SAMPLE_PROMPTS[language].map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(sample.query);
                  handleSendQuery(sample.query);
                }}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl whitespace-nowrap transition-colors"
              >
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Microphone & Text Submission */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center space-x-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30'
                : speechSupported
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title={
              !speechSupported
                ? 'Speech recognition not supported in this browser'
                : isListening
                ? 'Stop listening'
                : language === 'ta'
                ? 'குரல் மூலம் கேட்க மைக் அழுத்தவும்'
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
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
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
                  ? 'தமிழில் உங்கள் கேள்வியை தட்டச்சு செய்யவும்...'
                  : 'Ask about government schemes in English or Tamil...'
              }
              className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-900 placeholder-slate-500 ${
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
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendQuery()}
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-civic-700 hover:bg-civic-800 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 shrink-0"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
