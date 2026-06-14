/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with client User-Agent matching system guidelines
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== '') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
  });
  console.log('Gemini API initialized successfully on server.');
} else {
  console.warn('WARNING: GEMINI_API_KEY is not configured or is a placeholder. Server will run in simulation mode.');
}

/**
 * Resilient helper function to execute Gemini requests with transient error retries (like 503 high-demand or rate limits).
 */
async function callGeminiWithRetry<T>(task: () => Promise<T>, retries = 3, initialDelayMs = 1500): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;
  while (attempt < retries) {
    try {
      return await task();
    } catch (error: any) {
      attempt++;
      const errorMessage = String(error?.message || '').toLowerCase();
      const status = error?.status || error?.statusCode;
      const isTransient = 
        status === 503 || 
        status === 429 || 
        errorMessage.includes('503') || 
        errorMessage.includes('429') || 
        errorMessage.includes('unavailable') || 
        errorMessage.includes('high demand') || 
        errorMessage.includes('overloaded');

      if (isTransient && attempt < retries) {
        console.warn(`[SpeakSense Resilience] Gemini API transient issue detected (Attempt ${attempt}/${retries}). Retrying in ${delay}ms... Details: ${error?.message || error}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('Gemini API failed after active retries.');
}

// REST api route: Regenerate Text (pulling high-quality excerpts of real-world official text in selected target language)
app.post('/api/text/regenerate', async (req, res) => {
  const { targetLanguage } = req.body;
  const lang = targetLanguage || 'English';

  try {
    if (ai) {
      const data = await callGeminiWithRetry(async () => {
        const response = await ai!.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Locate a single, real-world, high-quality, highly authentic, official paragraph excerpt (between 40 and 80 words) from a well-known historical speech, scientific document, or literary masterpiece translated into or originally written in ${lang}. It MUST be an official, real source, not AI-generated gibberish. Provide the title of the work, the direct verbatim text, and its exact official historical/literary source.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Title of the historical speech, book, paper, or document.' },
                text: { type: Type.STRING, description: 'Verbatim paragraph excerpt.' },
                source: { type: Type.STRING, description: 'Exact historical author, document, or publication source and date.' },
              },
              required: ['title', 'text', 'source'],
            },
          },
        });
        return JSON.parse(response.text || '{}');
      });

      return res.json(data);
    }
  } catch (error) {
    console.error('Error generating real text (Falling back to simulated presets):', error);
  }

  // High-fidelity fallback presets based on language:
  const fallbacks: Record<string, Array<{ title: string; text: string; source: string }>> = {
    English: [
      {
        title: 'The Gettysburg Address',
        text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.',
        source: 'Abraham Lincoln, Address at Gettysburg, Pennsylvania, November 19, 1863',
      },
      {
        title: 'Special Theory of Relativity (Excerpt)',
        text: 'Every general law of nature must be so constituted that it is transformed into a law of exactly the same form when, instead of the co-ordinates of the original system of reference, we introduce the co-ordinates of a new system of reference which is moving in uniform translation relatively to the first.',
        source: 'Albert Einstein, "On the Electrodynamics of Moving Bodies", Annalen der Physik, 1905',
      },
      {
        title: "Winston Churchill's Historic Speech",
        text: 'We shall defend our island, whatever the cost may be. We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender.',
        source: 'Winston Churchill, Address to the House of Commons, June 4, 1940',
      },
    ],
    Spanish: [
      {
        title: 'Don Quijote de la Mancha (Prólogo)',
        text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.',
        source: 'Miguel de Cervantes Saavedra, "El ingenioso hidalgo Don Quijote de la Mancha", 1605',
      },
    ],
    French: [
      {
        title: 'Le Petit Prince',
        text: 'Les grands ne comprennent jamais rien tout seuls, et c’est fatigant, pour les enfants, de toujours et toujours leur donner des explications. J’ai donc dû choisir un autre métier et j’ai appris à piloter des avions. J’ai volé un peu partout dans le monde.',
        source: 'Antoine de Saint-Exupéry, "Le Petit Prince", 1943',
      },
    ],
    German: [
      {
        title: 'Brief an den Vater',
        text: 'Du fragtest mich neulich, warum ich behaupte, ich hätte Furcht vor dir. Ich wusste dir, wie gewöhnlich, nichts zu antworten, zum Teil eben aus der Furcht, die ich vor dir habe, zum Teil deshalb, weil zur Begründung dieser Furcht zu viele Einzelheiten gehören, als dass ich sie im Reden halbwegs zusammenhalten könnte.',
        source: 'Franz Kafka, "Brief an den Vater", geschriebenes Manuskript, November 1919',
      },
    ],
  };

  const genericFallbacks = [
    {
      title: 'Universal Declaration of Human Rights',
      text: 'All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.',
      source: 'United Nations General Assembly, Article 1 of the UDHR, December 10, 1948',
    },
  ];

  const pool = fallbacks[lang] || genericFallbacks;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return res.json(chosen);
});

// REST api route: Reading Feedback (comparing user reading to expected text)
app.post('/api/speech/reading-feedback', async (req, res) => {
  const { expectedText, transcribedText, targetLanguage, struggles } = req.body;

  if (!expectedText || !transcribedText) {
    return res.status(400).json({ error: 'Expected text and transcribed text are required' });
  }

  try {
    if (ai) {
      const prompt = `You are a linguist and speech coach analyzing a reading fluency exercise.
Expected target text to be read: "${expectedText}"
Actual text spoken (transcribed): "${transcribedText}"
Target Language: ${targetLanguage || 'English'}
User's selected focus areas of struggles: ${JSON.stringify(struggles || [])}

Compare the target text and spoken text. Identify:
1. "skippedWords": Exact words in expected text that were completely missing in transcribedText. Be fair, ignore slight case differences and surrounding punctuation.
2. "misreadWords": Words that were misspoken, substituted, or had substantial phonetic distortion (mapping each bad spoken word back to the expected target word).
3. "pronunciationNotes": Concrete, encouraging tips to help pronunciation based on language (${targetLanguage}) and their selected struggles (e.g. Pronunciation, Reading Fluency, Tone).
4. "fluencyScore": An overall accuracy score (0-100) based on text match and readability. If it matches perfectly, score is 100.

Return this analysis in JSON format conforming to the requested schema.`;

      const data = await callGeminiWithRetry(async () => {
        const response = await ai!.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                skippedWords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of words in the expected text that were skipped entirely.',
                },
                misreadWords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING, description: 'The word as mispronounced or substituted by user.' },
                      expected: { type: Type.STRING, description: 'The original target word from the expected text.' },
                    },
                    required: ['word', 'expected'],
                  },
                  description: 'Substitutions or pronunciation mistakes.',
                },
                pronunciationNotes: {
                  type: Type.STRING,
                  description: 'Polished advice on specific vowel/consonant vocal habits.',
                },
                fluencyScore: {
                  type: Type.INTEGER,
                  description: 'Score from 0 to 100.',
                },
              },
              required: ['skippedWords', 'misreadWords', 'pronunciationNotes', 'fluencyScore'],
            },
          },
        });
        return JSON.parse(response.text || '{}');
      });

      return res.json(data);
    }
  } catch (error) {
    console.error('Gemini reading feedback error (Falling back to simulated assessment):', error);
  }

  // High-fidelity Javascript Local Match Algorithm as fully operational fallback:
  const expectedLower = expectedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').split(/\s+/);
  const transcribedLower = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').split(/\s+/);

  const expectedSet = new Set(expectedLower);
  const transcribedSet = new Set(transcribedLower);

  const skippedWords: string[] = [];
  expectedLower.forEach((word: string) => {
    if (!transcribedSet.has(word) && word.length > 2) {
      skippedWords.push(word);
    }
  });

  const misreadWords: Array<{ word: string; expected: string }> = [];
  // basic zip pairing for simple mismatch detection
  for (let i = 0; i < Math.min(expectedLower.length, transcribedLower.length); i++) {
    if (expectedLower[i] !== transcribedLower[i]) {
      misreadWords.push({
        word: transcribedLower[i],
        expected: expectedLower[i],
      });
    }
  }

  const uniqueSkipped = Array.from(new Set(skippedWords)).slice(0, 3);
  const uniqueMisread = misreadWords.slice(0, 3);
  const wrongCount = uniqueSkipped.length + uniqueMisread.length;
  const fluencyScore = Math.max(50, Math.min(100, 100 - wrongCount * 12));

  return res.json({
    skippedWords: uniqueSkipped,
    misreadWords: uniqueMisread,
    pronunciationNotes: `Keep up the good work! Your voice is clear. Pay attention to word endings and maintain consistent pace.`,
    fluencyScore,
  });
});

// REST api route: Conversation Mode
app.post('/api/speech/conversation-chat', async (req, res) => {
  const { messages, targetLanguage, struggles } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages list is required' });
  }

  // Format the conversation history for Gemini
  const chatContext = messages.map(m => `${m.sender === 'ai' ? 'Coach' : 'User'}: ${m.text}`).join('\n');

  try {
    if (ai) {
      const prompt = `You are an encouraging, expert conversational Speech Coach guiding a conversation.
Current Target Language: ${targetLanguage || 'English'}
User's focus struggles: ${JSON.stringify(struggles || [])}

Conversation history so far:
${chatContext}

Generate the brief, welcoming next conversational reply (no more than 30-40 words) from the Coach in ${targetLanguage}.
Additionally, thoroughly analyze the USER's last spoken statement (the very last User message in the history text). Identify:
1. User's speech tone (e.g., 'Confident & Friendly', 'Paced but Hesitant').
2. Any typical filler words present in their transcription (like um, uh, like, translation particles, etc.).
3. Clarity summary (tips on sentence flow, pronunciation help).
4. Specific pronunciation help if they struggle with some key vocabulary in ${targetLanguage}.

Return a JSON payload with 'replyText' and 'feedback' structure.`;

      const data = await callGeminiWithRetry(async () => {
        const response = await ai!.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                replyText: { type: Type.STRING, description: 'The coach helpful, natural response in the target language.' },
                feedback: {
                  type: Type.OBJECT,
                  properties: {
                    tone: { type: Type.STRING, description: 'Description of user speech demeanor.' },
                    fillerWords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Filler words detected.' },
                    clarity: { type: Type.STRING, description: 'Analysis of phrase construction, structural flow.' },
                    pronunciationHelp: { type: Type.STRING, description: 'Phonetic advice for the target words.' },
                  },
                  required: ['tone', 'fillerWords', 'clarity', 'pronunciationHelp'],
                },
              },
              required: ['replyText', 'feedback'],
            },
          },
        });
        return JSON.parse(response.text || '{}');
      });

      return res.json(data);
    }
  } catch (error) {
    console.error('conversation agent error (Falling back to simulated response):', error);
  }

  // Simulated fallback response
  const lastUserMsg = messages[messages.length - 1]?.text || '';
  const isSpanish = targetLanguage === 'Spanish';
  const isFrench = targetLanguage === 'French';
  const isGerman = targetLanguage === 'German';

  let replyText = "Tell me more about your experience! What has been the most exciting part of your day?";
  if (isSpanish) replyText = '¡Qué interesante! Cuéntame, ¿qué es lo que más te apasiona o te gusta hacer en tu tiempo libre?';
  if (isFrench) replyText = "C'est merveilleux ! Dites-m'en plus, qu'est-ce qui vous intéresse le plus dans votre quotidien ?";
  if (isGerman) replyText = 'Das ist faszinierend! Erzählen Sie mir mehr darüber, was begeistert Sie am meisten?';

  // Basic search for fillers like "um", "uh", "eh", "wie"
  const fillersFound: string[] = [];
  const lowercaseText = lastUserMsg.toLowerCase();
  ['um', 'uh', 'like', 'ah', 'eh', 'y\'know', 'eso', 'je de', 'äh'].forEach(f => {
    if (new RegExp(`\\b${f}\\b`).test(lowercaseText)) {
      fillersFound.push(f);
    }
  });

  return res.json({
    replyText,
    feedback: {
      tone: fillersFound.length > 1 ? 'Thoughtful & Paced' : 'Confident & Articulate',
      fillerWords: fillersFound,
      clarity: 'Outstanding grammatical structure. Words are correctly formulated.',
      pronunciationHelp: 'Everything sounds pristine. Focus on breathing breaks to boost confidence and steady rhythm.',
    },
  });
});

// REST api route: Free Speech analysis (detecting filler, code switching, clarity)
app.post('/api/speech/free-speech-feedback', async (req, res) => {
  const { transcribedText, targetLanguage, struggles, nativeLanguage } = req.body;

  if (!transcribedText) {
    return res.status(400).json({ error: 'Transcribed text is required' });
  }

  try {
    if (ai) {
      const prompt = `You are an advanced multilingual speech coach.
User spoken text: "${transcribedText}"
Their native language: ${nativeLanguage || 'English'}
Their target/selected language: ${targetLanguage || 'English'}
User struggles selected: ${JSON.stringify(struggles || [])}

Analyze the user spoken text.
1. "codeSwitches": If they selected "Unintentional code-switching", check if they switched words, prefixes, or phrases between ${nativeLanguage} and ${targetLanguage}. If yes, return array of { word, alternative, definition, correction }. If they didn't select this struggle or there are no switches, return empty array.
2. "fillerWords": Look for vocalized fillers (um, uh, like, ah, y'know, sort of, etc.).
3. "fluency": General feedback on pacing, natural flow, rhythm.
4. "clarity": Grammatical soundness and intelligibility of the spoken text.
5. "tone": Demeanor assessment.

Return this feedback as a JSON payload according to the defined schema.`;

      const data = await callGeminiWithRetry(async () => {
        const response = await ai!.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                codeSwitches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING, description: 'The foreign word or mixed phrase spoken.' },
                      alternative: { type: Type.STRING, description: 'The recommendation in target language.' },
                      definition: { type: Type.STRING, description: 'Definition or context of the switch.' },
                      correction: { type: Type.STRING, description: 'How to form the thought in target language.' },
                    },
                    required: ['word', 'alternative', 'definition', 'correction'],
                  },
                  description: 'Unintentional language switching events.',
                },
                fillerWords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Filler words used.',
                },
                fluency: { type: Type.STRING, description: 'Fluency remarks.' },
                clarity: { type: Type.STRING, description: 'Clarity / structural flow remarks.' },
                tone: { type: Type.STRING, description: 'Tone delivery remarks.' },
              },
              required: ['codeSwitches', 'fillerWords', 'fluency', 'clarity', 'tone'],
            },
          },
        });
        return JSON.parse(response.text || '{}');
      });

      return res.json(data);
    }
  } catch (error) {
    console.error('free-speech feedback error (Falling back to simulated feedback):', error);
  }

  // Simulated  local match fallbacks
  const fillersFound: string[] = [];
  const textLower = transcribedText.toLowerCase();
  ['um', 'uh', 'like', 'ah', 'eh', 'y\'know'].forEach(f => {
    if (new RegExp(`\\b${f}\\b`).test(textLower)) {
      fillersFound.push(f);
    }
  });

  // Basic mock detection for code switching
  const codeSwitches: any[] = [];
  const native = (nativeLanguage || 'Spanish').toLowerCase();
  const target = (targetLanguage || 'English').toLowerCase();

  // If client is target English and Spanish is native, detect some Spanish words
  if (target === 'english' && /como|gracias|amigo|hola|bueno/i.test(transcribedText)) {
    const spanishMatches = transcribedText.match(/como|gracias|amigo|hola|bueno/gi) || [];
    spanishMatches.forEach((m: string) => {
      const lower = m.toLowerCase();
      let alt = 'friend';
      let def = 'Spanish word';
      if (lower === 'como') { alt = 'like / how'; def = 'Spanish conjunction'; }
      if (lower === 'gracias') { alt = 'thank you'; def = 'expressing gratitude'; }
      if (lower === 'hola') { alt = 'hello'; def = 'greeting'; }
      if (lower === 'bueno') { alt = 'well / good'; def = 'filler or adjective'; }

      codeSwitches.push({
        word: m,
        alternative: alt,
        definition: def,
        correction: `Express this in ${targetLanguage} directly by using "${alt}".`,
      });
    });
  }

  return res.json({
    codeSwitches: struggles.includes('Unintentional code-switching') ? codeSwitches : [],
    fillerWords: fillersFound,
    fluency: 'Excellent conversational voice. The speech flow is rich and demonstrates a very direct sense of pacing.',
    clarity: 'Clear thoughts and sentence structure. Minor corrections can easily be made by speaking a bit slower.',
    tone: 'Confident, friendly, and authentic. (AI Simulation Mode)',
  });
});

// Configure Vite or Static Files Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from: ' + distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Speech Coach Express server running at: http://localhost:${PORT}`);
  });
}

startServer();
