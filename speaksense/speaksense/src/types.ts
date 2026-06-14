/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  nativeLanguage: string;
  targetLanguages: string[];
  struggles: string[];
}

export interface SpeechHistoryItem {
  id: string;
  type: 'Reading' | 'Conversation' | 'FreeSpeech';
  language: string;
  score?: number;
  wordCount: number;
  timestamp: string;
  title?: string;
}

export interface SpeechStats {
  totalSessions: number;
  highestFluency: number;
  totalSpokenWords: number;
  practiceStreak: number;
  lastPracticeDate: string | null;
  history: SpeechHistoryItem[];
}


export interface ReadingText {
  id: string;
  title: string;
  text: string;
  source: string;
}

export interface ReadingFeedback {
  skippedWords: string[];
  misreadWords: Array<{ word: string; expected: string }>;
  pronunciationNotes: string;
  fluencyScore: number;
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  feedback?: {
    tone?: string;
    fillerWords?: string[];
    clarity?: string;
    pronunciationHelp?: string;
  };
}

export interface CodeSwitchDetail {
  word: string;
  alternative: string;
  definition: string;
  correction: string;
}

export interface FreeSpeechFeedback {
  codeSwitches: CodeSwitchDetail[];
  fillerWords: string[];
  fluency: string;
  clarity: string;
  tone: string;
  rawFeedbackText?: string;
}
