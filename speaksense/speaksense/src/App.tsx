/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  Languages,
  RotateCw,
  CheckCircle2,
  User,
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Send,
  Sparkles,
  BookOpen,
  MessageSquare,
  Compass,
  Check,
  ChevronRight,
  Info,
  X,
  HelpCircle,
  Activity,
  Award,
  Flame,
  Trash2,
  History,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import {
  UserProfile,
  ReadingText,
  ReadingFeedback,
  Message,
  CodeSwitchDetail,
  FreeSpeechFeedback,
  SpeechHistoryItem,
  SpeechStats
} from './types';

// Predefined available languages
const LANGUAGES_POOL = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Arabic',
  'Hindi'
];

// Predefined list of sample struggles
const STRUGGLES_POOL = [
  'Unintentional code-switching',
  'Pronunciation',
  'Reading fluency (skipping words / reading difficulty)',
  'Tone of voice'
];

// Free speech prompts
const FREE_SPEECH_PROMPTS = [
  "Describe a moment in your life when you felt intensely proud of yourself.",
  "Describe what your ideal daily routine looks like and why it benefits you.",
  "Explain your perspective on the role of creative arts in an AI-driven society.",
  "If you could have a 1-hour conversation with any historical figure, who would it be?",
  "Talk about a teacher, mentor, or family member who fundamentally shaped who you are today."
];

export default function App() {
  // Stage state: welcome -> language -> struggles -> dashboard -> mode1 -> mode2 -> mode3
  const [stage, setStage] = useState<'welcome' | 'language' | 'struggles' | 'dashboard' | 'mode1' | 'mode2' | 'mode3'>(() => {
    try {
      const saved = localStorage.getItem('speaksense_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name.trim()) {
          return 'dashboard';
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'welcome';
  });
  
  // User profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    const defaults = {
      name: '',
      nativeLanguage: 'English',
      targetLanguages: ['English'],
      struggles: [...STRUGGLES_POOL]
    };
    try {
      const saved = localStorage.getItem('speaksense_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });

  // User statistics & progress savings
  const [stats, setStats] = useState<SpeechStats>(() => {
    const defaults: SpeechStats = {
      totalSessions: 0,
      highestFluency: 0,
      totalSpokenWords: 0,
      practiceStreak: 0,
      lastPracticeDate: null,
      history: []
    };
    try {
      const saved = localStorage.getItem('speaksense_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          history: Array.isArray(parsed?.history) ? parsed.history : []
        };
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });

  // Toggle state to show/hide Linguistic progress insights to reduce clutter
  const [showProgress, setShowProgress] = useState(false);

  // Accessibility preferences
  const [selectedFont, setSelectedFont] = useState<'default' | 'lexend' | 'opendyslexic'>(() => {
    return (localStorage.getItem('speaksense_font') as any) || 'default';
  });

  const [selectedTheme, setSelectedTheme] = useState<'classic' | 'pastel' | 'oceanic' | 'warm'>(() => {
    return (localStorage.getItem('speaksense_theme') as any) || 'classic';
  });

  const [showSettings, setShowSettings] = useState(false);

  // Persist Profile and Statistics changes to localStorage
  useEffect(() => {
    localStorage.setItem('speaksense_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('speaksense_stats', JSON.stringify(stats));
  }, [stats]);

  // Apply visual style states based on font & theme Selection
  useEffect(() => {
    localStorage.setItem('speaksense_font', selectedFont);
    const root = document.documentElement;
    if (selectedFont === 'lexend') {
      root.style.setProperty('--font-app-sans', '"Lexend", sans-serif');
      root.style.setProperty('--font-app-display', '"Lexend", sans-serif');
    } else if (selectedFont === 'opendyslexic') {
      root.style.setProperty('--font-app-sans', '"OpenDyslexic", "Arial", sans-serif');
      root.style.setProperty('--font-app-display', '"OpenDyslexic", "Verdana", sans-serif');
    } else {
      root.style.setProperty('--font-app-sans', '"Arial", "Helvetica Neue", Helvetica, sans-serif');
      root.style.setProperty('--font-app-display', '"Verdana", Geneva, sans-serif');
    }
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem('speaksense_theme', selectedTheme);
    const THEMES_MAP = {
      classic: {
        bg: '#FCFAF7',
        cardBg: '#FFFFFF',
        text: '#000000',
        brand: '#FF7A18',
        brandHover: '#E05E00',
        brandLight: '#FFF5F0',
        border: '#E5E7EB',
      },
      pastel: {
        bg: '#FAF9F5',
        cardBg: '#FAF9F5',
        text: '#2E3A31',
        brand: '#7A9A82',
        brandHover: '#5B7C63',
        brandLight: '#E8EFE9',
        border: '#D9E1D9',
      },
      oceanic: {
        bg: '#EFE9DF',
        cardBg: '#FAF6ED',
        text: '#1E293B',
        brand: '#4E7D9E',
        brandHover: '#335E7A',
        brandLight: '#E5EFF6',
        border: '#DFD8CC',
      },
      warm: {
        bg: '#FAF5EE',
        cardBg: '#FFFDF9',
        text: '#382A1C',
        brand: '#B48A78',
        brandHover: '#8C6656',
        brandLight: '#FAF0EB',
        border: '#ECE1D5',
      }
    };
    const theme = THEMES_MAP[selectedTheme] || THEMES_MAP.classic;
    const root = document.documentElement;
    root.style.setProperty('--color-app-bg', theme.bg);
    root.style.setProperty('--color-app-text', theme.text);
    root.style.setProperty('--color-app-brand', theme.brand);
    root.style.setProperty('--color-app-brand-hover', theme.brandHover);
    root.style.setProperty('--color-app-brand-light', theme.brandLight);
    root.style.setProperty('--color-app-card', theme.cardBg);
    root.style.setProperty('--color-app-border', theme.border);
  }, [selectedTheme]);

  // Record a completed speech practice exercise and update stats + streak
  const recordSessionCompleted = (
    type: 'Reading' | 'Conversation' | 'FreeSpeech',
    language: string,
    score?: number,
    wordCount = 0,
    title?: string
  ) => {
    setStats(prev => {
      let newStreak = prev.practiceStreak;
      const todayStr = new Date().toDateString(); // e.g. "Thu Jun 11 2026"
      
      if (prev.practiceStreak === 0) {
        newStreak = 1;
      } else if (prev.lastPracticeDate) {
        const lastDate = new Date(prev.lastPracticeDate);
        const todayDate = new Date();
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = prev.practiceStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1; // broken, restart
        }
      } else {
        newStreak = 1;
      }

      const newHighestFluency = score !== undefined ? Math.max(prev.highestFluency, score) : prev.highestFluency;
      const newTotalSpokenWords = prev.totalSpokenWords + wordCount;

      const newHistoryItem: SpeechHistoryItem = {
        id: Date.now().toString(),
        type,
        language,
        score,
        wordCount,
        timestamp: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        title
      };

      const updatedHistory = [newHistoryItem, ...prev.history].slice(0, 15);

      return {
        totalSessions: prev.totalSessions + 1,
        highestFluency: newHighestFluency,
        totalSpokenWords: newTotalSpokenWords,
        practiceStreak: newStreak,
        lastPracticeDate: todayStr,
        history: updatedHistory
      };
    });
  };

  // Current session active target language (derived or adjusted in-session)
  const [sessionTargetLanguage, setSessionTargetLanguage] = useState<string>('English');

  // Text-To-Speech (TTS) audio coach settings
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // -------------------------------------------------------------
  // Mode 1 State: Reading Mode
  // -------------------------------------------------------------
  const [readingText, setReadingText] = useState<ReadingText | null>(null);
  const [readingFeedback, setReadingFeedback] = useState<ReadingFeedback | null>(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [readingWordCount, setReadingWordCount] = useState<number>(0);

  // -------------------------------------------------------------
  // Mode 2 State: Conversation Mode
  // -------------------------------------------------------------
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [activeChatFeedback, setActiveChatFeedback] = useState<Message['feedback'] | null>(null);
  const [chatInputToggle, setChatInputToggle] = useState('');
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  // -------------------------------------------------------------
  // Mode 3 State: Free Speech Mode
  // -------------------------------------------------------------
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [freeSpeechFeedback, setFreeSpeechFeedback] = useState<FreeSpeechFeedback | null>(null);
  const [isAnalyzingFreeSpeech, setIsAnalyzingFreeSpeech] = useState(false);
  const [selectedCodeSwitchWord, setSelectedCodeSwitchWord] = useState<CodeSwitchDetail | null>(null);

  // Fallback direct text input fallback box state for speech sandbox simulation
  const [manualTranscriptInput, setManualTranscriptInput] = useState('');
  const [showManualInputFallback, setShowManualInputFallback] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Initialize Speech Recognition Hook linked to sessionTargetLanguage
  const {
    isSupported: isMicSupported,
    isRecording,
    interimTranscript,
    finalTranscript,
    setFinalTranscript,
    error: micError,
    startRecording,
    stopRecording,
    resetTranscript
  } = useSpeechRecognition({
    language: sessionTargetLanguage
  });

  // Automatically sync speech recognition final transcripts to our local processing fields
  useEffect(() => {
    if (finalTranscript) {
      setManualTranscriptInput(finalTranscript);
      if (isRecording) {
        setReadingWordCount(finalTranscript.trim().split(/\s+/).length);
      }
    }
  }, [finalTranscript, isRecording]);

  // Synchronize target languages
  useEffect(() => {
    if (profile.targetLanguages.length > 0) {
      setSessionTargetLanguage(profile.targetLanguages[0]);
    }
  }, [profile.targetLanguages]);

  // Trigger TTS voice playback for the AI coach replies
  const speakVoiceText = (text: string, langName: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    
    // Stop any existing speech activity first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find the correct voice based on selected target language
    const langMapCode: Record<string, string> = {
      English: 'en-US',
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      Portuguese: 'pt-PT',
      Chinese: 'zh-CN',
      Japanese: 'ja-JP',
      Arabic: 'ar-SA',
      Hindi: 'hi-IN',
    };

    const targetLangCode = langMapCode[langName] || 'en-US';
    utterance.lang = targetLangCode;

    // Retrieve system voices
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(targetLangCode) || v.lang.includes(targetLangCode));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    // Low standard pitch and standard speech rate to feel friendly and coach-like
    utterance.pitch = 1.0;
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
  };

  // -------------------------------------------------------------
  // Step Navigation Handlers
  // -------------------------------------------------------------
  const handleWelcomeSubmit = (name: string) => {
    setProfile(prev => ({ ...prev, name }));
    setStage('language');
  };

  const handleLanguageSubmit = () => {
    setStage('struggles');
  };

  const handleStrugglesSubmit = () => {
    setStage('dashboard');
  };

  // -------------------------------------------------------------
  // Mode Action 1: Reading Mode Handlers & API Calls
  // -------------------------------------------------------------
  const selectMode1 = async () => {
    setStage('mode1');
    setReadingFeedback(null);
    setManualTranscriptInput('');
    resetTranscript();
    await fetchActiveReadingText();
  };

  const fetchActiveReadingText = async () => {
    setIsReadingLoading(true);
    setReadingError(null);
    try {
      const response = await fetch('/api/text/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetLanguage: sessionTargetLanguage })
      });
      if (response.ok) {
        const data = await response.json();
        setReadingText(data);
      } else {
        throw new Error('Could not pull online official excerpts.');
      }
    } catch (err: any) {
      console.error(err);
      setReadingError('Connection timeout. Loading standard offline excerpts.');
      // Offline backup
      setReadingText({
        id: 'backup',
        title: 'The Gettysburg Address (Excerpt)',
        text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
        source: 'Abraham Lincoln, Address at Gettysburg, Pennsylvania, November 19, 1863'
      });
    } finally {
      setIsReadingLoading(false);
    }
  };

  const triggerReadingSpeechAnalysis = async (userTextToAnalyze: string) => {
    if (!readingText || !userTextToAnalyze.trim()) return;
    setIsReadingLoading(true);
    try {
      const res = await fetch('/api/speech/reading-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedText: readingText.text,
          transcribedText: userTextToAnalyze,
          targetLanguage: sessionTargetLanguage,
          struggles: profile.struggles
        })
      });
      if (res.ok) {
        const feedbackResult = await res.json();
        setReadingFeedback(feedbackResult);
        const words = userTextToAnalyze.trim().split(/\s+/).length;
        recordSessionCompleted(
          'Reading',
          sessionTargetLanguage,
          feedbackResult.fluencyScore,
          words,
          readingText.title
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReadingLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Mode Action 2: Conversation Mode Handlers & API Calls
  // -------------------------------------------------------------
  const selectMode2 = () => {
    setStage('mode2');
    setManualTranscriptInput('');
    resetTranscript();
    setActiveChatFeedback(null);

    // Initial greeting in chosen language
    let initialGreeting = "Hello! I am your conversational speech companion. Let's practice speaking naturally. How has your experience been today?";
    if (sessionTargetLanguage === 'Spanish') {
      initialGreeting = "¡Hola! Soy tu compañero de conversación. Practiquemos hablar de manera natural. ¿Qué tal ha estado tu día?";
    } else if (sessionTargetLanguage === 'French') {
      initialGreeting = "Bonjour ! Je suis votre compagnon de conversation. Pratiquons de manière naturelle. Comment s'est passée votre journée ?";
    } else if (sessionTargetLanguage === 'German') {
      initialGreeting = "Hallo! Ich bin dein Gesprächspartner. Lass uns ganz natürlich sprechen. Wie war dein Tag heute?";
    }

    const defaultGreetingMsg: Message = {
      id: 'greeting',
      sender: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory([defaultGreetingMsg]);
    setTimeout(() => {
      speakVoiceText(initialGreeting, sessionTargetLanguage);
    }, 450);
  };

  const handleSendConversationMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setManualTranscriptInput('');
    setChatInputToggle('');
    resetTranscript();
    setIsCoachThinking(true);

    try {
      const response = await fetch('/api/speech/conversation-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          targetLanguage: sessionTargetLanguage,
          struggles: profile.struggles
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          feedback: data.feedback
        };
        setChatHistory(prev => [...prev, aiMsg]);
        setActiveChatFeedback(data.feedback);
        speakVoiceText(data.replyText, sessionTargetLanguage);
        const words = textToSend.trim().split(/\s+/).length;
        recordSessionCompleted(
          'Conversation',
          sessionTargetLanguage,
          undefined,
          words,
          'Interactive Exchange'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoachThinking(false);
    }
  };

  // -------------------------------------------------------------
  // Mode Action 3: Free Speech Handlers & API Calls
  // -------------------------------------------------------------
  const selectMode3 = () => {
    setStage('mode3');
    setFreeSpeechFeedback(null);
    setManualTranscriptInput('');
    setSelectedCodeSwitchWord(null);
    resetTranscript();
  };

  const rotateFreeSpeechPrompt = () => {
    setFreeSpeechFeedback(null);
    setManualTranscriptInput('');
    resetTranscript();
    setSelectedCodeSwitchWord(null);
    setActivePromptIndex(prev => (prev + 1) % FREE_SPEECH_PROMPTS.length);
  };

  const triggerFreeSpeechAnalysis = async (userTextToAnalyze: string) => {
    if (!userTextToAnalyze.trim()) return;
    setIsAnalyzingFreeSpeech(true);
    setSelectedCodeSwitchWord(null);
    try {
      const response = await fetch('/api/speech/free-speech-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcribedText: userTextToAnalyze,
          nativeLanguage: profile.nativeLanguage,
          targetLanguage: sessionTargetLanguage,
          struggles: profile.struggles
        })
      });

      if (response.ok) {
        const feedbackResult = await response.json();
        setFreeSpeechFeedback(feedbackResult);
        const words = userTextToAnalyze.trim().split(/\s+/).length;
        recordSessionCompleted(
          'FreeSpeech',
          sessionTargetLanguage,
          undefined,
          words,
          `Prompt Excerpt`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingFreeSpeech(false);
    }
  };

  // -------------------------------------------------------------
  // Global Microphone Control System
  // -------------------------------------------------------------
  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
      // Wait a tiny moment for transcripts to settle
      setTimeout(() => {
        const transcriptToProcess = finalTranscript || manualTranscriptInput;
        if (transcriptToProcess.trim()) {
          if (stage === 'mode1') {
            triggerReadingSpeechAnalysis(transcriptToProcess);
          } else if (stage === 'mode2') {
            handleSendConversationMessage(transcriptToProcess);
          } else if (stage === 'mode3') {
            triggerFreeSpeechAnalysis(transcriptToProcess);
          }
        }
      }, 500);
    } else {
      resetTranscript();
      setManualTranscriptInput('');
      setReadingFeedback(null);
      if (stage === 'mode3') setFreeSpeechFeedback(null);
      startRecording();
    }
  };

  // Fallback direct text submit when users can't use Speech API (typing fallback)
  const handleManualTranscriptSubmit = () => {
    if (!manualTranscriptInput.trim()) return;
    if (stage === 'mode1') {
      triggerReadingSpeechAnalysis(manualTranscriptInput);
    } else if (stage === 'mode2') {
      handleSendConversationMessage(manualTranscriptInput);
    } else if (stage === 'mode3') {
      triggerFreeSpeechAnalysis(manualTranscriptInput);
    }
  };

  // Helper to get active user's initials
  const getUserInitials = () => {
    if (!profile.name) return 'A';
    return profile.name.charAt(0).toUpperCase();
  };

  // -------------------------------------------------------------
  // UI Sub-Render Stages
  // -------------------------------------------------------------

  // Render: Welcome Stage
  if (stage === 'welcome') {
    return (
      <div id="welcome-container" className="flex flex-col items-center justify-center min-h-[90vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-[24px] p-10 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] text-center"
        >
          {/* Visual Badge Accent */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-light text-brand mb-6">
            <div className="w-5 h-5 bg-[#FF7A18] rounded-full animate-pulse"></div>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            SpeakSense
          </h1>
          <p className="text-[#FF7A18] font-medium text-xs uppercase tracking-widest mb-6">
            Linguistic Coaching Companion
          </p>
          <p className="text-gray-500 font-light text-base leading-relaxed mb-8">
            Improve how you speak through natural feedback, conversational AI coaching, and speech performance analysis.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (profile.name.trim()) {
                setStage('language');
              }
            }}
            className="space-y-5 text-left"
          >
            <div>
              <label htmlFor="input-name" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Enter your name
              </label>
              <input
                id="input-name"
                type="text"
                required
                placeholder="e.g. Alex"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-5 py-4 bg-[#FCFAF7] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A18]/50 focus:border-[#FF7A18] text-gray-800 transition duration-200 font-medium placeholder-gray-400 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={!profile.name.trim()}
              className="w-full py-4 bg-[#FF7A18] hover:bg-brand-hover disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-brand/10 transition-all duration-200 text-sm leading-none"
            >
              Continue
            </button>
          </form>

          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-8 flex items-center justify-center gap-1.5 leading-none">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A18]" /> AI Technology
          </div>
        </motion.div>
      </div>
    );
  }

  // Render: Language Selection Stage
  if (stage === 'language') {
    return (
      <div id="language-selection" className="flex flex-col items-center justify-center min-h-[90vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-[24px] p-10 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setStage('welcome')}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#FF7A18]">
              Step 2 of 3
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Select your languages
          </h2>
          <p className="text-gray-500 font-light text-sm mb-6 leading-relaxed">
            Select your native language and the target languages you wish to practice conversational agility in.
          </p>

          <div className="space-y-5">
            {/* Native Language Select */}
            <div>
              <label htmlFor="native-lang" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Native Language
              </label>
              <div className="relative">
                <select
                  id="native-lang"
                  value={profile.nativeLanguage}
                  onChange={(e) => setProfile(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                  className="w-full appearance-none px-4 py-3.5 bg-[#FCFAF7] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A18]/50 text-gray-800 text-sm font-semibold pr-10"
                >
                  {LANGUAGES_POOL.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <Languages className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Target Language Select (Support Multi-selection / single primary selection) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Practice Target Language(s)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {LANGUAGES_POOL.map(lang => {
                  const isSelected = profile.targetLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => {
                        if (isSelected) {
                          // keep at least 1
                          if (profile.targetLanguages.length > 1) {
                            setProfile(prev => ({
                              ...prev,
                              targetLanguages: prev.targetLanguages.filter(t => t !== lang)
                            }));
                          }
                        } else {
                          setProfile(prev => ({
                            ...prev,
                            targetLanguages: [...prev.targetLanguages, lang]
                          }));
                        }
                      }}
                      className={`px-3 py-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
                        isSelected
                          ? 'border-[#FF7A18] bg-orange-50 text-[#FF7A18]'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FF7A18]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleLanguageSubmit}
              className="w-full mt-6 py-4 bg-[#FF7A18] hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 text-sm leading-none"
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render: Struggles Selection Stage
  if (stage === 'struggles') {
    return (
      <div id="struggles-selection" className="flex flex-col items-center justify-center min-h-[90vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-[24px] p-10 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setStage('language')}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#FF7A18]">
              Step 3 of 3
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
            What do you struggle with?
          </h2>
          <p className="text-gray-500 font-light text-sm mb-6 leading-relaxed">
            Select your verbal communication challenges. Your real-time linguistic coach adjusts targeted feedback based on these metrics.
          </p>

          <div className="space-y-2">
            {STRUGGLES_POOL.map(struggle => {
              const isSelected = profile.struggles.includes(struggle);
              return (
                <button
                  key={struggle}
                  onClick={() => {
                    if (isSelected) {
                      setProfile(prev => ({
                        ...prev,
                        struggles: prev.struggles.filter(s => s !== struggle)
                      }));
                    } else {
                      setProfile(prev => ({
                        ...prev,
                        struggles: [...prev.struggles, struggle]
                      }));
                    }
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all duration-200 ${
                    isSelected
                      ? 'border-[#FF7A18] bg-orange-50/60 text-[#FF7A18]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isSelected ? 'border-[#FF7A18] bg-[#FF7A18] text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {struggle === 'Reading fluency (skipping words / reading difficulty)' ? 'Reading Fluency' : struggle}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      {struggle === 'Unintentional code-switching' && 'Corrects sudden slips into multiple languages.'}
                      {struggle === 'Pronunciation' && 'Measures phonetic accuracy and phonetic distortions.'}
                      {struggle === 'Reading fluency (skipping words / reading difficulty)' && 'Tracks skipped, added, or substituted speech words.'}
                      {struggle === 'Tone of voice' && 'Analyzes demeanor (confident, monotone, hesitant, etc.)'}
                    </p>
                  </div>
                </button>
              );
            })}

            <button
              onClick={handleStrugglesSubmit}
              className="w-full mt-6 py-4 bg-[#FF7A18] hover:bg-brand-hover text-white font-bold rounded-xl transition-all duration-200 text-sm leading-none"
            >
              Start Practice
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Define layout wrapper to preserve beautiful header & footer of selected "Clean Utility / Minimal"
  const renderCleanUtilityHeader = (practiceModeTitle: string) => {
    return (
      <header className="flex justify-between items-center px-10 py-6 bg-[#FAF9F6] border-b border-gray-100">
        <div 
          onClick={() => setStage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-4.5 h-4.5 bg-[#FF7A18] rounded-full"></div>
          <span className="text-2xl font-black tracking-tight text-[#FF7A18] font-display">SpeakSense</span>
        </div>
        
        <div className="flex items-center gap-5">
          {/* Active target language dropdown switcher per session */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-gray-100 shadow-sm">
            <Languages className="w-4 h-4 text-[#FF7A18]" />
            <select
              value={sessionTargetLanguage}
              onChange={(e) => setSessionTargetLanguage(e.target.value)}
              className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
              title="Switch Target Language for this session"
            >
              {profile.targetLanguages.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Speech Companion Active</p>
              <p className="font-bold text-sm text-gray-800">{practiceModeTitle}</p>
            </div>
          </div>

          <div
            onClick={() => setStage('struggles')}
            className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FF7A18] font-black border border-[#FF7A18]/20 cursor-pointer hover:bg-orange-200/50 transition"
            title="Edit challenges"
          >
            {getUserInitials()}
          </div>
        </div>
      </header>
    );
  };

  const renderCleanUtilityFooter = (recLabel = "Interactive Vocal Input") => {
    return (
      <footer className="relative flex flex-col items-center justify-center pb-12 pt-4 bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleMicrophoneClick}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-white transition-all transform hover:scale-105 active:scale-95 shadow-md ${
              isRecording
                ? 'bg-red-500 animate-mic-pulse text-white shadow-red-500/30'
                : 'bg-[#FF7A18] text-white shadow-[#FF7A18]/30'
            }`}
            title={isRecording ? "Click to stop recording" : "Click to hold and talk"}
          >
            {isRecording ? (
              <Square className="w-7 h-7 fill-white stroke-none" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          
          <div className="flex flex-col items-center justify-center gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
              {isRecording ? 'Recording Sound... Click stop when finished' : recLabel}
            </span>
            
            {/* Direct transcript helper text */}
            {interimTranscript && (
              <p className="text-xs text-gray-500 max-w-md text-center bg-white px-3 py-1 rounded-lg border border-gray-100 mt-2 italic shadow-sm">
                "{interimTranscript}"
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Speech Setup Failure Warning */}
        {micError && (
          <div className="mt-4 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-xs text-center flex items-center gap-2 max-w-md">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Toggleable Keyboard Override System */}
        <div className="mt-4">
          <button
            onClick={() => setShowManualInputFallback(!showManualInputFallback)}
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#FF7A18] underline transition"
          >
            {showManualInputFallback ? "Hide typing console" : "Open speech sandbox typing console"}
          </button>
          
          {showManualInputFallback && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl max-w-sm text-left shadow-lg space-y-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Sandbox transcript simulation</span>
              <textarea
                placeholder="Simulate speech transcription here in case mic is busy or quiet..."
                value={manualTranscriptInput}
                onChange={(e) => setManualTranscriptInput(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF7A18] h-18 text-gray-800"
              />
              <button
                onClick={handleManualTranscriptSubmit}
                disabled={!manualTranscriptInput.trim()}
                className="w-full bg-[#FF7A18] hover:bg-brand-hover disabled:bg-gray-200 text-white font-bold py-2 px-3 rounded-lg text-xs"
              >
                Simulate Voice Input Analysis
              </button>
            </div>
          )}
        </div>
      </footer>
    );
  };

  // Render: 4. Main Dashboard Stage
  if (stage === 'dashboard') {
    return (
      <div id="dashboard-stage" className="flex flex-col min-h-screen bg-[#FAF9F6] pb-12">
        {renderCleanUtilityHeader('Overview Dashboard')}

        <main className="flex-grow px-6 sm:px-10 py-10 max-w-4xl mx-auto w-full space-y-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-black mb-1.5 leading-tight">
              Welcome, <span className="text-[#FF7A18] font-black">{profile.name}</span>
            </h1>
            <p className="text-black font-normal text-sm opacity-90">
              Practicing <span className="font-bold text-[#FF7A18]">{sessionTargetLanguage}</span> speech. Select an active training coach module below:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode 1: Read a Text */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={selectMode1}
              className="bg-white p-7 text-left rounded-[24px] border border-gray-200 hover:border-[#FF7A18]/40 transition shadow-[0_4px_16px_rgba(0,0,0,0.015)] group relative"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center mb-6 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-black group-hover:text-[#FF7A18] transition mb-2">
                1. Read a Text
              </h2>
              <p className="text-xs text-black leading-relaxed font-normal opacity-85">
                Practice fluency, pronunciation correctness, and timing on structured paragraphs gathered from real-world documents.
              </p>
              <div className="absolute bottom-6 right-6 text-gray-300 group-hover:text-[#FF7A18] transition">
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Mode 2: Speak with AI */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={selectMode2}
              className="bg-white p-7 text-left rounded-[24px] border border-gray-200 hover:border-[#FF7A18]/40 transition shadow-[0_4px_16px_rgba(0,0,0,0.015)] group relative"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center mb-6 font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-black group-hover:text-[#FF7A18] transition mb-2">
                2. Speak with AI
              </h2>
              <p className="text-xs text-black leading-relaxed font-normal opacity-85">
                Conduct conversational practice. Speak naturally, detect filler words, check tone structure, and get active guidance.
              </p>
              <div className="absolute bottom-6 right-6 text-gray-300 group-hover:text-[#FF7A18] transition">
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Mode 3: Free Speech Profile */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              onClick={selectMode3}
              className="bg-white p-7 text-left rounded-[24px] border border-gray-200 hover:border-[#FF7A18]/40 transition shadow-[0_4px_16px_rgba(0,0,0,0.015)] group relative"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center mb-6 font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-black group-hover:text-[#FF7A18] transition mb-2">
                3. Free Speech
              </h2>
              <p className="text-xs text-black leading-relaxed font-normal opacity-85">
                Talk freely regarding open communication topics. Check unintentional language switching and receive detailed metrics.
              </p>
              <div className="absolute bottom-6 right-6 text-gray-300 group-hover:text-[#FF7A18] transition">
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FF7A18]/10 text-[#FF7A18] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#FF7A18] leading-none mb-1">Session Target Language</p>
                <p className="text-sm font-bold text-black">Practicing in {sessionTargetLanguage}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-black font-semibold">Speech Audio Synth:</span>
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-2 rounded-lg border transition ${
                  ttsEnabled ? 'border-[#FF7A18] bg-[#FF7A18]/5 text-[#FF7A18]' : 'border-gray-200 text-gray-400'
                }`}
                title={ttsEnabled ? "TTS Enabled" : "TTS Muted"}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Progress and Statistics Dashboard Panel */}
          <div className="mt-8 space-y-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="w-full flex justify-between items-center hover:opacity-85 transition text-left cursor-pointer group py-1"
              title="Toggle Progress Insights"
            >
              <h3 className="font-display text-lg font-bold text-black flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF7A18]" />
                Linguistic Progress Insights
                <span className="text-xs font-normal text-gray-500 ml-1">
                  {showProgress ? '(Click to hide)' : '(Click to show)'}
                </span>
              </h3>
              <span className="text-xs text-black font-bold bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition shadow-sm">
                {showProgress ? '▼ Hide statistics' : '▲ Show statistics & history'}
              </span>
            </button>

            {showProgress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Daily Streak Card */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center flex-shrink-0 font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-black">Practice Streak</p>
                      <p className="text-xl font-extrabold text-[#FF7A18]">{stats.practiceStreak} Days</p>
                      <p className="text-[10px] text-black mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                        Last: {stats.lastPracticeDate || 'No dates yet'}
                      </p>
                    </div>
                  </div>

                  {/* Highest Fluency Score */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center flex-shrink-0 font-bold">
                      <Award className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-black">Peak Fluency Ratio</p>
                      <p className="text-xl font-extrabold text-black">
                        {stats.highestFluency > 0 ? `${stats.highestFluency}%` : '--'}
                      </p>
                      <p className="text-[10px] text-black mt-0.5">Highest reading accuracy</p>
                    </div>
                  </div>

                  {/* Spoken Word Count */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF7A18] flex items-center justify-center flex-shrink-0 font-bold">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-black">Spoken Volume</p>
                      <p className="text-xl font-extrabold text-black">{stats.totalSpokenWords} Words</p>
                      <p className="text-[10px] text-black mt-0.5">Across all speech coaches</p>
                    </div>
                  </div>
                </div>

                {/* History logs bento panel */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#FF7A18]" />
                      Practice History Logs ({stats.history.length})
                    </h4>
                    {stats.history.length > 0 && (
                      <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded">
                        Coached modules
                      </span>
                    )}
                  </div>

                  {stats.history.length === 0 ? (
                    <div className="text-center py-8 bg-[#FCFAF7] border border-dashed border-gray-250 rounded-xl">
                      <p className="text-xs text-black font-semibold">No practice history recorded yet.</p>
                      <p className="text-[10px] text-black mt-1">Start your first speech exercise (Read, Conversate, or Improvise) to log details!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
                      {stats.history.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between text-xs font-semibold font-sans">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded font-bold text-[9px] uppercase tracking-wide flex-shrink-0 ${
                              item.type === 'Reading' ? 'bg-amber-150 text-amber-700' :
                              item.type === 'Conversation' ? 'bg-blue-150 text-blue-700' :
                              'bg-indigo-150 text-indigo-700'
                            }`}>
                              {item.type}
                            </span>
                            <div>
                              <p className="text-black font-bold text-xs font-sans">
                                {item.type === 'Reading' ? `Read: ${item.title || 'Excerpt'}` : 
                                 item.type === 'Conversation' ? 'Chat Exchange' : 'Free Speech Improv'}
                              </p>
                              <p className="text-[9px] text-black font-medium mt-0.5 uppercase tracking-wider font-sans">
                                {item.language} • {item.timestamp}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            {item.score !== undefined && (
                              <p className="text-xs font-bold text-[#FF7A18]">Fluency: {item.score}%</p>
                            )}
                            <p className="text-[10px] text-black font-medium">{item.wordCount} words spoken</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Custom Settings & Accessibility Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6 overflow-hidden mt-6"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-gray-150">
                    <div>
                      <h3 className="font-display text-lg font-bold text-black flex items-center gap-2">
                        <Settings className="w-5 h-5 text-brand" />
                        Settings & Accessibility Profile
                      </h3>
                      <p className="text-xs text-black opacity-75 font-medium mt-0.5">Customize your speech experience, active struggles, fonts, and eye-friendly themes</p>
                    </div>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
                      title="Close Settings"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Section 1: User Profile Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">1. General Profile</h4>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5">Practice Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-xs font-semibold text-black"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5">Native Language</label>
                        <select
                          value={profile.nativeLanguage}
                          onChange={(e) => setProfile(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-xs font-semibold text-black"
                        >
                          {LANGUAGES_POOL.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section 1b: Practice Target Languages */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">2. Practice Target Languages</h4>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                        {LANGUAGES_POOL.map(lang => {
                          const isSelected = profile.targetLanguages.includes(lang);
                          return (
                            <button
                              key={lang}
                              onClick={() => {
                                if (isSelected) {
                                  if (profile.targetLanguages.length > 1) {
                                    setProfile(prev => ({
                                      ...prev,
                                      targetLanguages: prev.targetLanguages.filter(t => t !== lang)
                                    }));
                                  }
                                } else {
                                  setProfile(prev => ({
                                    ...prev,
                                    targetLanguages: [...prev.targetLanguages, lang]
                                  }));
                                }
                              }}
                              className={`px-2.5 py-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all duration-150 ${
                                isSelected
                                  ? 'border-brand bg-brand-light text-brand shadow-sm font-bold'
                                  : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                              }`}
                            >
                              <span>{lang}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Speech Struggles selection */}
                  <div className="space-y-3 pt-4 border-t border-gray-150">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">3. Define Targeted Speech Struggles</h4>
                    <p className="text-[11px] text-black opacity-80 leading-normal">Your speech coach highlights metrics and guides you based on these active struggles:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {STRUGGLES_POOL.map(struggle => {
                        const isSelected = profile.struggles.includes(struggle);
                        return (
                          <button
                            key={struggle}
                            onClick={() => {
                              if (isSelected) {
                                setProfile(prev => ({
                                  ...prev,
                                  struggles: prev.struggles.filter(s => s !== struggle)
                                }));
                              } else {
                                setProfile(prev => ({
                                  ...prev,
                                  struggles: [...prev.struggles, struggle]
                                }));
                              }
                            }}
                            className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all duration-150 ${
                              isSelected
                                ? 'border-brand bg-brand-light text-brand shadow-sm font-bold'
                                : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                            }`}
                          >
                            <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'border-brand bg-brand text-white' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-none text-black truncate">
                                {struggle === 'Reading fluency (skipping words / reading difficulty)' ? 'Reading Fluency' : struggle}
                              </p>
                              <p className="text-[9px] text-black opacity-60 mt-1 leading-snug">
                                {struggle === 'Unintentional code-switching' && 'Corrects sudden slips into multiple languages.'}
                                {struggle === 'Pronunciation' && 'Measures phonetic accuracy.'}
                                {struggle === 'Reading fluency (skipping words / reading difficulty)' && 'Tracks skipped or added speech words.'}
                                {struggle === 'Tone of voice' && 'Analyzes demeanor and hesitancy.'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Font Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-150">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                        4. Accessibility Font Preferences
                      </h4>
                      <p className="text-[11px] text-black opacity-85 leading-normal">
                        Change standard typography settings to suit your learning and reading preferences.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Default */}
                        <button
                          onClick={() => setSelectedFont('default')}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            selectedFont === 'default'
                              ? 'border-brand bg-brand-light text-brand font-bold'
                              : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-xs font-sans">Default</p>
                          <span className="text-[8px] text-gray-400 font-sans block mt-0.5">Arial/Verdana</span>
                        </button>

                        {/* Lexend */}
                        <button
                          onClick={() => setSelectedFont('lexend')}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            selectedFont === 'lexend'
                              ? 'border-brand bg-brand-light text-brand font-bold'
                              : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: '"Lexend", sans-serif' }}
                        >
                          <p className="text-xs w-full block text-ellipsis overflow-hidden">Lexend</p>
                          <span className="text-[8px] text-gray-400 block mt-0.5 w-full text-ellipsis overflow-hidden">Dyslexia Soft</span>
                        </button>

                        {/* OpenDyslexic */}
                        <button
                          onClick={() => setSelectedFont('opendyslexic')}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            selectedFont === 'opendyslexic'
                              ? 'border-brand bg-brand-light text-brand font-bold'
                              : 'border-gray-200 bg-white text-black hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: '"OpenDyslexic", "Arial", sans-serif' }}
                        >
                          <p className="text-xs w-full block text-ellipsis overflow-hidden">Dyslexic</p>
                          <span className="text-[8px] text-gray-400 block mt-0.5 w-full text-ellipsis overflow-hidden">Weighted</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 4: Calming Themes selection */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                        5. Eye-Friendly Color Themes
                      </h4>
                      <p className="text-[11px] text-black opacity-85 leading-normal">
                        Select soft, desaturated palettes with warm background contrast to prevent eye fatigue.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Classic */}
                        <button
                          onClick={() => setSelectedTheme('classic')}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                            selectedTheme === 'classic' ? 'border-brand bg-brand-light shadow-sm font-bold' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#FF7A18] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-black leading-none truncate">Classic</p>
                            <span className="text-[8px] text-black opacity-65 font-medium mt-0.5 block truncate">Orange & Cream</span>
                          </div>
                        </button>

                        {/* Sage & Cream */}
                        <button
                          onClick={() => setSelectedTheme('pastel')}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                            selectedTheme === 'pastel' ? 'border-[#7A9A82] bg-[#E8EFE9] shadow-sm font-bold' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#7A9A82] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-black leading-none truncate font-semibold">Sage & Cream</p>
                            <span className="text-[8px] text-black opacity-65 font-medium mt-0.5 block truncate">Soothing Pastel</span>
                          </div>
                        </button>

                        {/* Soft Oceanic */}
                        <button
                          onClick={() => setSelectedTheme('oceanic')}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                            selectedTheme === 'oceanic' ? 'border-[#4E7D9E] bg-[#E5EFF6] shadow-sm font-bold' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#4E7D9E] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-black leading-none truncate font-semibold">Blue & Sand</p>
                            <span className="text-[8px] text-black opacity-65 font-medium mt-0.5 block truncate">Soft Oceanic</span>
                          </div>
                        </button>

                        {/* Warm Neutral */}
                        <button
                          onClick={() => setSelectedTheme('warm')}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                            selectedTheme === 'warm' ? 'border-[#B48A78] bg-[#FAF0EB] shadow-sm font-bold' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#B48A78] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-black leading-none truncate font-semibold">Taupe & Eggshell</p>
                            <span className="text-[8px] text-black opacity-65 font-medium mt-0.5 block truncate font-medium">Warm Neutral</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Profile administration buttons */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-150 gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-4 py-2 text-xs font-bold text-brand hover:bg-brand/5 border border-brand/20 bg-white rounded-xl transition duration-150 font-sans flex items-center gap-1.5 shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showSettings ? 'Hide Settings' : 'Settings & Accessibility Preferences'}
                </button>
              </div>

              <div className="relative">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition duration-150 flex items-center gap-1.5 font-sans"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Progress
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-250 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest font-sans">Are you absolutely sure?</span>
                    <button
                      onClick={() => {
                        // Reset all core states
                        localStorage.removeItem('speaksense_profile');
                        localStorage.removeItem('speaksense_stats');
                        setProfile({
                          name: '',
                          nativeLanguage: 'English',
                          targetLanguages: ['English'],
                          struggles: [...STRUGGLES_POOL]
                        });
                        setStats({
                          totalSessions: 0,
                          highestFluency: 0,
                          totalSpokenWords: 0,
                          practiceStreak: 0,
                          lastPracticeDate: null,
                          history: []
                        });
                        setShowResetConfirm(false);
                        setStage('welcome');
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition font-sans"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition font-sans"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render: MODE 1 — READING MODE
  if (stage === 'mode1') {
    // Parser to render targeted highlights in Reading text box after receiving feedback
    const renderReadingSnippetWithHighlights = () => {
      if (!readingText) return null;
      if (!readingFeedback) {
        return (
          <p className="text-2xl sm:text-3xl leading-[1.65] font-medium text-gray-700 font-display">
            {readingText.text}
          </p>
        );
      }

      const { skippedWords, misreadWords } = readingFeedback;

      // Normalize clean tokens
      const words = readingText.text.split(/(\s+)/);

      return (
        <p className="text-2xl sm:text-3xl leading-[1.65] font-medium text-gray-700 font-display">
          {words.map((chunk, index) => {
            if (/^\s+$/.test(chunk)) {
              return chunk; // keep whitespace spacing
            }

            // clean punctuation characters to compare
            const cleanWord = chunk.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '');

            // 1. Is it skipped?
            const isSkipped = profile.struggles.includes('Reading fluency (skipping words / reading difficulty)') &&
              skippedWords.some(w => w.toLowerCase() === cleanWord);

            // 2. Is it misread?
            const matchedMisread = profile.struggles.includes('Pronunciation') &&
              misreadWords.find(m => m.expected.toLowerCase() === cleanWord);

            if (isSkipped) {
              return (
                <span
                  key={index}
                  className="bg-red-50 text-red-500 border-b-2 border-red-400 px-1 rounded-sm font-bold inline-block mx-0.5 cursor-help"
                  title="Skipped during recording"
                >
                  {chunk}
                </span>
              );
            }

            if (matchedMisread) {
              return (
                <span
                  key={index}
                  className="bg-yellow-100 text-yellow-700 border-b-2 border-yellow-500 px-1 rounded-sm font-bold inline-block mx-0.5 cursor-help"
                  title={`Phonetically read as: "${matchedMisread.word}"`}
                >
                  {chunk}
                </span>
              );
            }

            return <span key={index}>{chunk}</span>;
          })}
        </p>
      );
    };

    return (
      <div id="mode1-reading" className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#2D2D2D] font-sans">
        {renderCleanUtilityHeader('Reading Practice')}

        <main className="flex-1 px-4 py-8 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full">
          {/* Main Reading Left Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-sm border border-gray-150 min-h-[360px] flex flex-col justify-between">
              
              <div className="flex justify-between items-start mb-6 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A18]">Source Material</span>
                  <p className="text-xs text-gray-400 font-medium italic mt-0.5 leading-none">
                    {readingText ? readingText.source : 'Loading source...'}
                  </p>
                </div>
                
                <button
                  onClick={fetchActiveReadingText}
                  disabled={isReadingLoading}
                  className="text-[#FF7A18] text-xs font-bold hover:underline flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isReadingLoading ? 'animate-spin' : ''}`} />
                  Regenerate Text
                </button>
              </div>

              {/* Text content displaying area */}
              <div className="my-auto py-4">
                {isReadingLoading && !readingText ? (
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-100 rounded-lg w-5/6 animate-pulse"></div>
                    <div className="h-6 bg-gray-100 rounded-lg w-4/6 animate-pulse"></div>
                    <div className="h-6 bg-gray-100 rounded-lg w-3/4 animate-pulse"></div>
                  </div>
                ) : (
                  renderReadingSnippetWithHighlights()
                )}
              </div>

              {/* Source Document Badge Title */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                  Excerpt: {readingText ? readingText.title : 'Official Document'}
                </span>
                
                {isRecording && (
                  <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    Words Intoned: {readingWordCount}
                  </span>
                )}
              </div>
            </div>

            {/* Micro Fluency Statistics Cards displaying row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Fluency Score</span>
                <span className="text-3xl font-black text-[#FF7A18] font-display">
                  {readingFeedback ? `${readingFeedback.fluencyScore}` : '--'}
                  <span className="text-xs text-gray-300 font-serif">/100</span>
                </span>
              </div>
              
              <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Words Spoken</span>
                <span className="text-3xl font-bold text-gray-750 font-display">
                  {readingWordCount || '--'}
                </span>
              </div>
              
              <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Phonetics Accent</span>
                <span className="text-xl font-bold text-gray-700 my-auto">
                  {readingFeedback ? (readingFeedback.misreadWords.length > 2 ? 'Improvable' : 'Clear Velocity') : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Feedback Right Pane */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-white rounded-[24px] p-8 border border-gray-150 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                <Award className="w-5 h-5 text-[#FF7A18]" />
                <h3 className="text-lg font-bold text-gray-800 font-display">Linguistic Coach Analysis</h3>
              </div>

              {!readingFeedback ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF7A18]/5 text-[#FF7A18] flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Awaiting voice recording</p>
                  <p className="text-xs text-gray-450 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Click the microphone button at the bottom and read the excerpt aloud cleanly.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Fluency score progress track */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1.5">
                      <span>VERBAL FLUENCY SPEED RATIO</span>
                      <span className="text-[#FF7A18]">{readingFeedback.fluencyScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF7A18] transition-all duration-500 rounded-full" 
                        style={{ width: `${readingFeedback.fluencyScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skipped words */}
                  {profile.struggles.includes('Reading fluency (skipping words / reading difficulty)') && (
                    <div className="bg-red-50/40 p-4 rounded-xl border border-red-100/50">
                      <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mb-1.5 uppercase">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        Skipped Words
                      </p>
                      {readingFeedback.skippedWords.length === 0 ? (
                        <p className="text-xs text-gray-500 italic font-medium">None detected! Fluid pacing maintained.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {readingFeedback.skippedWords.map((word, idx) => (
                            <span key={idx} className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-lg border border-red-100 font-bold">
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Misread words */}
                  {profile.struggles.includes('Pronunciation') && (
                    <div className="bg-yellow-50/40 p-4 rounded-xl border border-yellow-105">
                      <p className="text-xs font-bold text-yellow-700 flex items-center gap-1.5 mb-1.5 uppercase">
                        <span className="w-2 h-2 rounded-full bg-yellow-405"></span>
                        Phonetic Distortions
                      </p>
                      {readingFeedback.misreadWords.length === 0 ? (
                        <p className="text-xs text-gray-500 italic font-medium">Perfect articulation parsed.</p>
                      ) : (
                        <div className="space-y-1.5 mt-1">
                          {readingFeedback.misreadWords.map((item, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              Expected <span className="font-bold text-gray-800">"{item.expected}"</span> but parsed <span className="text-yellow-700 font-bold">"{item.word}"</span>.
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* General Pronunciation notes */}
                  <div className="bg-[#FAF9F6] p-4.5 rounded-xl border border-gray-150">
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-2 uppercase">
                      <Lightbulb className="w-3.5 h-3.5 text-[#FF7A18]" />
                      Coach Verbal Recommendation
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {readingFeedback.pronunciationNotes}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setReadingFeedback(null);
                      setManualTranscriptInput('');
                      resetTranscript();
                      setReadingWordCount(0);
                    }}
                    className="w-full mt-4 py-4 border-2 border-[#FF7A18] text-[#FF7A18] font-bold rounded-xl hover:bg-orange-50 transition-all text-xs"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {renderCleanUtilityFooter('Read the visual paragraph excerpt aloud')}
      </div>
    );
  }

  // Render: MODE 2 — CONVERSATION MODE
  if (stage === 'mode2') {
    return (
      <div id="mode2-conversation" className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#2D2D2D] font-sans">
        {renderCleanUtilityHeader('Conversational Practice')}

        <main className="flex-1 px-4 py-8 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full">
          
          {/* Chat Panel - Left Area */}
          <div className="lg:col-span-8 flex flex-col h-[520px] bg-white rounded-[24px] border border-gray-150 shadow-sm overflow-hidden w-full">
            
            {/* Active chat stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-4.5 ${
                      isAI
                        ? 'bg-[#FCFAF7] border border-gray-100 rounded-tl-none text-gray-800 shadow-sm'
                        : 'bg-[#FF7A18] text-white rounded-tr-none'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed font-sans">{msg.text}</p>
                      
                      <div className="flex items-center justify-between mt-2 gap-3">
                        <span className={`text-[9px] uppercase tracking-wider font-bold ${isAI ? 'text-gray-400' : 'text-orange-200'}`}>
                          {isAI ? 'Speech AI Coach' : profile.name} • {msg.timestamp}
                        </span>

                        {isAI && (
                          <button
                            onClick={() => speakVoiceText(msg.text, sessionTargetLanguage)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition"
                            title="Speak response text"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#FF7A18]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isCoachThinking && (
                <div className="flex justify-start">
                  <div className="bg-[#FCFAF7] border border-gray-100 rounded-2xl rounded-tl-none p-4.5 space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse leading-none">
                      Coach is listening & analyzing pronouncements...
                    </p>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-100"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom interactive typing selector in case user can't read/speak */}
            <div className="p-4.5 border-t border-gray-100 bg-[#FCFAF7] flex gap-3">
              <input
                type="text"
                placeholder="Can't pronounce a word? Type your reply directly here instead..."
                value={chatInputToggle}
                onChange={(e) => setChatInputToggle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendConversationMessage(chatInputToggle);
                }}
                className="flex-grow bg-white px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A18] text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => handleSendConversationMessage(chatInputToggle)}
                disabled={!chatInputToggle.trim() || isCoachThinking}
                className="bg-[#FF7A18] hover:bg-brand-hover text-white px-4 rounded-xl flex items-center justify-center transition disabled:bg-gray-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Speech Statistics & Companion Feedback Console - Right Area */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-gray-150 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                <Activity className="w-5 h-5 text-[#FF7A18]" />
                <h3 className="text-lg font-bold text-gray-800 font-display">Phonetic & Fluency Metric</h3>
              </div>

              {!activeChatFeedback ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FF7A18]/5 text-[#FF7A18] flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Active Monitoring</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Say something using the microphone below to see detailed structural tone, filler analysis, and phonetic help details.
                  </p>
                </div>
              ) : (
                <div className="space-y-5.5">
                  {/* Demeanor Tone */}
                  {profile.struggles.includes('Tone of voice') && (
                    <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-100">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#FF7A18] mb-1">USER ACTIVE TONE</p>
                      <p className="text-sm font-black text-gray-800">{activeChatFeedback.tone || 'Balanced & Confident'}</p>
                    </div>
                  )}

                  {/* Filler words */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">VOCALIZED FILLERS USED</p>
                    {activeChatFeedback.fillerWords && activeChatFeedback.fillerWords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeChatFeedback.fillerWords.map((f, idx) => (
                          <span key={idx} className="bg-white text-xs text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-bold uppercase">
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 font-bold italic">Perfect! Zero filler speech detected.</p>
                    )}
                  </div>

                  {/* Clarity structure */}
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">SENTENCE CLARITY</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      {activeChatFeedback.clarity || 'Sentence structure was perfectly structured and easily intelligible.'}
                    </p>
                  </div>

                  {/* Pronunciation helpful hints */}
                  {profile.struggles.includes('Pronunciation') && activeChatFeedback.pronunciationHelp && (
                    <div className="p-4 bg-[#FCFAF7] rounded-xl border border-gray-150">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#FF7A18]" />
                        Pronunciation Advisory
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed italic">
                        "{activeChatFeedback.pronunciationHelp}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {renderCleanUtilityFooter('Hold & Speak to answer the AI coach')}
      </div>
    );
  }

  // Render: MODE 3 — FREE SPEECH / PROMPT MODE
  if (stage === 'mode3') {
    // Parser for Free speech transcript: Highlights code switching events instantly
    const renderFreeSpeechSnippetWithAlternativeHighlights = () => {
      const displayTranscript = finalTranscript || manualTranscriptInput;
      if (!displayTranscript || !freeSpeechFeedback) {
        return (
          <p className="text-lg text-gray-400 italic">
            {displayTranscript ? `"${displayTranscript}"` : 'Your continuous microphone transcripts will appear here...'}
          </p>
        );
      }

      const { codeSwitches } = freeSpeechFeedback;

      if (!profile.struggles.includes('Unintentional code-switching') || !codeSwitches || codeSwitches.length === 0) {
        return <p className="text-lg text-gray-700 leading-relaxed font-sans">{displayTranscript}</p>;
      }

      // Basic regex splitting to safely find and replace words
      const words = displayTranscript.split(/(\s+)/);

      return (
        <p className="text-lg text-gray-700 leading-relaxed">
          {words.map((chunk, index) => {
            if (/^\s+$/.test(chunk)) return chunk;

            const clean = chunk.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '');
            const matchedSwitch = codeSwitches.find(s => s.word.toLowerCase() === clean);

            if (matchedSwitch) {
              return (
                <span
                  key={index}
                  onClick={() => setSelectedCodeSwitchWord(matchedSwitch)}
                  className="border-b-2 border-dashed border-[#FF7A18] text-[#FF7A18] font-bold bg-orange-50/50 px-1 rounded-sm cursor-pointer hover:bg-orange-100 transition inline-block mx-0.5"
                  title="Unintentional code switch detected. Click elements to inspect definition!"
                >
                  {chunk}
                </span>
              );
            }

            return <span key={index}>{chunk}</span>;
          })}
        </p>
      );
    };

    return (
      <div id="mode3-freespeech" className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#2D2D2D] font-sans">
        {renderCleanUtilityHeader('Free Speech & Improv')}

        <main className="flex-1 px-4 py-8 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full">
          
          {/* Main Free speech prompts + Transcript output - Left Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            {/* Improv Daily prompt card in center */}
            <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-gray-150 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#FF7A18]"></div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A18]">Practice Prompt Card</span>
                <button
                  onClick={rotateFreeSpeechPrompt}
                  className="text-xs font-bold text-gray-400 hover:text-[#FF7A18] flex items-center gap-1.5 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Next Prompt
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 font-display tracking-tight leading-snug">
                "{FREE_SPEECH_PROMPTS[activePromptIndex]}"
              </h2>
            </div>

            {/* Spoken transcription dashboard block */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-gray-150 shadow-sm min-h-[220px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-4">Spoken Transcript Analysis</span>
              
              <div className="min-h-[120px] py-2">
                {isAnalyzingFreeSpeech ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                  </div>
                ) : (
                  renderFreeSpeechSnippetWithAlternativeHighlights()
                )}
              </div>

              {freeSpeechFeedback?.codeSwitches && freeSpeechFeedback.codeSwitches.length > 0 && (
                <div className="mt-4 pt-1 flex items-center gap-2 text-xs text-[#FF7A18] font-bold">
                  <Info className="w-4 h-4 animate-bounce" />
                  <span>Interactive highlight active! Click underlined terms to see linguistic substitutions details.</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Metrics pane right */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Activity className="w-5 h-5 text-[#FF7A18]" />
                <h3 className="text-lg font-bold text-gray-800 font-display">Improv Companion Analysis</h3>
              </div>

              {!freeSpeechFeedback ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-[#FF7A18]/5 text-[#FF7A18] flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Awaiting Improv Speech</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[210px] mx-auto leading-relaxed">
                    Formulate your thoughts and talk freely about the prompt card. We will map grammatical patterns.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Code-switching breakdown section if active choice is checked */}
                  {profile.struggles.includes('Unintentional code-switching') && (
                    <div className="bg-orange-50/40 p-4 rounded-xl border border-orange-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A18] mb-1.5">CODE-SWITCHING INDEX</p>
                      <p className="text-sm font-black text-gray-800">
                        {freeSpeechFeedback.codeSwitches.length === 0
                          ? 'Consistent Native Speech'
                          : `${freeSpeechFeedback.codeSwitches.length} Switches Detected`}
                      </p>
                    </div>
                  )}

                  {/* Filler word metric statistics card */}
                  <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-150">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">FILLERS RATING</p>
                    {freeSpeechFeedback.fillerWords && freeSpeechFeedback.fillerWords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {freeSpeechFeedback.fillerWords.map((f, idx) => (
                          <span key={idx} className="bg-white text-[10px] font-bold border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded shadow-sm">
                            {f.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-700 font-bold italic">Flawless! Free of any verbal fillers or stutter markers.</p>
                    )}
                  </div>

                  {/* Verbal fluency remarks */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">SPEED & PACE</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {freeSpeechFeedback.fluency}
                    </p>
                  </div>

                  {/* Structural clarity */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">INTENSE GRAMMAR CLARITY</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {freeSpeechFeedback.clarity}
                    </p>
                  </div>
                </div>
              )}

              {/* In-context active code switcher selection details modal-card popup */}
              {selectedCodeSwitchWord && (
                <div className="p-4.5 bg-orange-50 rounded-xl border border-[#FF7A18]/30 space-y-3 relative">
                  <button 
                    onClick={() => setSelectedCodeSwitchWord(null)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                    title="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <span className="text-[10px] font-bold tracking-widest text-[#FF7A18] uppercase block leading-none">Code Switch Breakdown</span>
                  <div>
                    <span className="text-xs text-gray-400">Term Spoken:</span>
                    <p className="text-base font-black text-gray-800 italic">"{selectedCodeSwitchWord.word}"</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">Grammar Definition:</span>
                    <p className="text-xs text-gray-600 leading-snug">{selectedCodeSwitchWord.definition}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-[#FF7A18]/15 shadow-sm">
                    <span className="text-[10px] font-bold text-[#FF7A18] uppercase tracking-wider block mb-1">Best Alternative Recommendation</span>
                    <p className="text-xs font-bold text-gray-800">Use "{selectedCodeSwitchWord.alternative}"</p>
                    <p className="text-[11px] text-gray-500 italic mt-0.5 leading-snug">"{selectedCodeSwitchWord.correction}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {renderCleanUtilityFooter('Hold & Speak to answer the prompt naturally')}
      </div>
    );
  }

  return null;
}


//I HAVE NO IDEA WHAT IM DOING HELP THIS IS MY FIRST PROJECT AND I JUST WANT TO LEARN HOW TO CODE PLEASE DONT JUDGE ME I KNOW THIS CODE IS A MESS BUT IM TRYING OKAY

