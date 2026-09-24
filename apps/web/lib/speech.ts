/** Browser speech recognition for Ask — no server, no SDK.
 *
 *  Uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
 *  Supported on Chrome and Safari; unavailable browsers keep typing only.
 */

export type SpeechSupport = 'available' | 'unavailable';

type RecognitionCtor = new () => SpeechRecognitionLike;

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechRecognitionResultEvent {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: {
      readonly isFinal: boolean;
      readonly length: number;
      [i: number]: { readonly transcript: string };
    };
  };
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupport(): SpeechSupport {
  return recognitionCtor() ? 'available' : 'unavailable';
}

/** Map a care-language tag onto a SpeechRecognition `lang` value. */
export function speechLangFor(tag: string): string {
  const base = tag.toLowerCase();
  if (base.startsWith('fr')) return 'fr-FR';
  if (base.startsWith('pt-br') || base === 'pt-br') return 'pt-BR';
  if (base.startsWith('pt')) return 'pt-PT';
  if (base.startsWith('es')) return 'es-ES';
  if (base.startsWith('tl') || base.startsWith('fil')) return 'fil-PH';
  if (base.startsWith('ar')) return 'ar-SA';
  if (base.startsWith('pl')) return 'pl-PL';
  if (base.startsWith('ro')) return 'ro-RO';
  if (base.startsWith('it')) return 'it-IT';
  if (base.startsWith('en-gb')) return 'en-GB';
  return 'en-GB';
}

export function createRecognition(lang: string): SpeechRecognitionLike | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = speechLangFor(lang);
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}
