'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChromeCopy } from '@mml/core';
import { createRecognition, speechSupport } from '../lib/speech.ts';

/** Question box with an optional mic — speak, then Ask runs on the final phrase. */
export function AskField({
  id = 'q',
  value,
  onChange,
  onSubmitHeard,
  language,
  chrome,
  placeholder,
  hint,
  label,
  disabled = false,
  autoFocus = false,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  /** Called once with the final transcript so the parent can submit Ask. */
  onSubmitHeard?: (transcript: string) => void;
  language: string;
  chrome: ChromeCopy;
  placeholder: string;
  hint: string;
  label: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognition>>(null);
  const finalRef = useRef('');
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmitHeard);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmitHeard;
  }, [onChange, onSubmitHeard]);

  useEffect(() => {
    setSupported(speechSupport() === 'available');
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore.
      }
    };
  }, []);

  function stop() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore.
    }
    setListening(false);
  }

  function start() {
    if (disabled || listening) return;
    const recognition = createRecognition(language);
    if (!recognition) {
      setStatus(chrome.speakUnavailable);
      return;
    }
    recognitionRef.current = recognition;
    finalRef.current = '';
    setStatus(chrome.listening);
    setListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = finalRef.current;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const piece = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += piece;
        else interim += piece;
      }
      finalRef.current = finalText;
      const next = (finalText || interim).trim();
      if (next) onChangeRef.current(next);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') setStatus(chrome.speakDenied);
      else if (event.error === 'no-speech') setStatus(chrome.speakNoSpeech);
      else if (event.error === 'aborted') setStatus(null);
      else setStatus(chrome.speakUnavailable);
    };

    recognition.onend = () => {
      setListening(false);
      const heard = finalRef.current.trim();
      if (heard) {
        onChangeRef.current(heard);
        setStatus(null);
        onSubmitRef.current?.(heard);
      } else {
        setStatus((current) =>
          current === chrome.speakDenied || current === chrome.speakUnavailable
            ? current
            : chrome.speakNoSpeech,
        );
      }
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setStatus(chrome.speakUnavailable);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <span className="hint">{hint}</span>
      <div className="ask-field">
        <textarea
          id={id}
          className="textarea ask-field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
        />
        {supported ? (
          <button
            type="button"
            className={`ask-mic${listening ? ' is-listening' : ''}`}
            onClick={() => (listening ? stop() : start())}
            aria-pressed={listening}
            aria-label={listening ? chrome.stopListening : chrome.tapToSpeak}
            disabled={disabled}
          >
            <MicIcon listening={listening} />
          </button>
        ) : null}
      </div>
      {status ? (
        <p className="hint" role="status">
          {status}
        </p>
      ) : supported ? (
        <p className="hint">{chrome.tapToSpeak}</p>
      ) : null}
    </div>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {listening ? (
        <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
      ) : (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </>
      )}
    </svg>
  );
}
