/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export const languageCodeMap: Record<string, string> = {
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

interface UseSpeechRecognitionOptions {
  language?: string;
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
}

export function useSpeechRecognition({
  language = 'English',
  onTranscriptChange,
  onFinalTranscript,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageCodeMap[language] || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error event:', event);
        if (event.error === 'not-allowed') {
          setError('Microphone permission is blocked. Please allow mic access in your browser.');
        } else if (event.error === 'no-speech') {
          // Ignore transient silence timeouts, as user might still want to speak
        } else {
          setError(`Recognition issue: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setFinalTranscript((prev) => {
            const updated = prev ? `${prev} ${finalText}` : finalText;
            if (onFinalTranscript) onFinalTranscript(updated);
            return updated;
          });
        }

        setInterimTranscript(interimText);
        if (onTranscriptChange) {
          onTranscriptChange(interimText);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Update target language code dynamically when selection changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageCodeMap[language] || 'en-US';
    }
  }, [language]);

  const startRecording = () => {
    if (!isSupported) {
      setError('Speech recognition is not natively supported in this browser. Please try Chrome/Safari or use typing fallback.');
      return;
    }
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetTranscript = () => {
    setFinalTranscript('');
    setInterimTranscript('');
  };

  return {
    isSupported,
    isRecording,
    interimTranscript,
    finalTranscript,
    setFinalTranscript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}
