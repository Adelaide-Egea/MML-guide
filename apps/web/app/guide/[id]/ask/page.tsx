'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  type Answer,
  type Candidate,
  type Prepared,
  acceptModelAnswer,
  chromeFor,
  modelContext,
  prepare,
  subjectsFor,
} from '@mml/core';
import { Breathing } from '../../../../components/Breathing.tsx';
import { TopBar } from '../../../../components/Chrome.tsx';
import { LanguageToggle } from '../../../../components/LanguageToggle.tsx';
import { useActions } from '../../../../lib/store.ts';
import { MediaThumb } from '../../../../components/MediaField.tsx';
import { useAppState } from '../../../../lib/store.ts';
import { track } from '../../../../lib/trial.ts';

/** The unreachable-assistant case is its own state rather than a hand-built Answer.
 *  A `grounded` answer with no prose would not survive the contract's own
 *  verification, and manufacturing one here to reuse the renderer would be exactly
 *  the shortcut that verification exists to catch. */
type Shown =
  | { readonly question: string; readonly kind: 'answer'; readonly answer: Answer }
  | { readonly question: string; readonly kind: 'degraded'; readonly candidates: readonly Candidate[] };

export default function AskPage() {
  const { id } = useParams<{ id: string }>();
  const { households, household: active, handovers } = useAppState();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);

  const handover = handovers.find((h) => h.id === id);
  const household = households.find((h) => h.id === handover?.householdId) ?? active;
  if (!handover) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
      </main>
    );
  }

  const subjects = subjectsFor(household, handover);
  const actions = useActions();
  const language = handover.language || 'en';
  const chrome = chromeFor(language);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked) return;
    track('ask');

    setBusy(true);
    try {
      // The routing decision happens here, before any network call. A
      // safety-critical question is answered from the parent's own words and there
      // is no code path from it to a language model.
      const prepared: Prepared = prepare(subjects, asked, language, household.routine);

      if (prepared.route !== 'model') {
        setShown({ question: asked, kind: 'answer', answer: prepared.answer });
        return;
      }

      try {
        const response = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: asked,
            language,
            // Only the entries retrieval selected. The model never sees the rest of
            // the household, the safety fields or the contact numbers.
            context: modelContext(prepared.candidates),
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const model = (await response.json()) as { body: string; citedEntryIds: string[] };
        const answer = acceptModelAnswer(prepared, model, language);
        if (answer.kind === 'refusal' && prepared.candidates.length > 0) {
          setShown({ question: asked, kind: 'degraded', candidates: prepared.candidates });
        } else {
          setShown({ question: asked, kind: 'answer', answer });
        }
      } catch {
        // The assistant being unavailable must not mean no answer. Retrieval is
        // deterministic and already ran, so the matched entries are shown exactly as
        // the parent wrote them.
        setShown({ question: asked, kind: 'degraded', candidates: prepared.candidates });
      }
    } finally {
      setBusy(false);
      setQuestion('');
    }
  }

  return (
    <main className="shell">
      <TopBar title={chrome.askTitle} back={`/guide/${handover.id}`} />

      <LanguageToggle
        value={language}
        onChange={(next) => actions.saveHandover({ ...handover, language: next })}
      />

      <form className="stack" onSubmit={(e) => void ask(e)} style={{ marginTop: 'var(--space-4)' }}>
        <div className="field">
          <label htmlFor="q">{chrome.whatDoYouNeed}</label>
          <span className="hint">{chrome.askHintParent}</span>
          <textarea
            id="q"
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={chrome.askPlaceholder}
            autoFocus
          />
        </div>
        <button type="submit" className="btn" disabled={busy || !question.trim()}>
          {busy ? chrome.looking : chrome.ask}
        </button>
      </form>

      {/* The one genuine wait left in the product, and the only place this belongs.
          It is mounted while the request is in flight and unmounted when it lands,
          so it can never run longer than the thing it is standing in for. */}
      {busy && (
        <Breathing
          lines={[chrome.lookingThrough, chrome.onlyWhatIsInGuide, chrome.nearlyThere]}
        />
      )}

      {!busy && shown && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <p className="muted">
            {chrome.youAsked}: {shown.question}
          </p>
          {shown.kind === 'answer' ? (
            <AnswerView answer={shown.answer} chrome={chrome} />
          ) : (
            <FromTheGuide candidates={shown.candidates} chrome={chrome} />
          )}
        </section>
      )}
    </main>
  );
}

/** What the guide says, with no model involved. Also what the whole product falls
 *  back to during a provider outage, which is why the AI is an improvement to this
 *  rather than a dependency of it. */
function FromTheGuide({
  candidates,
  chrome,
}: {
  candidates: readonly Candidate[];
  chrome: ReturnType<typeof chromeFor>;
}) {
  return (
    <div className="answer stack-tight">
      <p className="muted">{chrome.assistantUnavailable}</p>
      {candidates.map((candidate) => (
        <div key={candidate.entry.id} className="stack-tight" style={{ marginTop: 'var(--space-3)' }}>
          <strong>{chrome.entryTitles[candidate.entry.title] ?? candidate.entry.title}</strong>
          <p className="block-body">{candidate.entry.body}</p>
          <span className="citation">
            {candidate.subjectName}
            {candidate.entry.writtenBy ? ` · written by ${candidate.entry.writtenBy}` : ''}
          </span>
          {candidate.entry.media.length > 0 && (
            <div className="media-grid">
              {candidate.entry.media.map((m) => (
                <MediaThumb key={m.id} media={m} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AnswerView({
  answer,
  chrome,
}: {
  answer: Answer;
  chrome: ReturnType<typeof chromeFor>;
}) {
  if (answer.kind === 'critical-passthrough') {
    return (
      <div className="critical stack-tight">
        <div className="eyebrow">
          {answer.subjectName
            ? chrome.subjectExactlyAsWritten(answer.subjectName)
            : chrome.exactlyAsWritten}
        </div>
        {/* Verbatim, in the language it was written in. A mistranslated allergen is
            the worst thing this product could do, so nothing here is rewritten. */}
        <p className="critical-body" lang={answer.verbatimLanguage}>
          {answer.verbatim}
        </p>
        <p className="muted">{chrome.safetyShownVerbatim}</p>
      </div>
    );
  }

  if (answer.kind === 'refusal') {
    return (
      <div className="notice stack-tight">
        <strong>{chrome.notInGuide}</strong>
        <p className="muted">{chrome.notInGuideHint}</p>
      </div>
    );
  }

  return (
    <div className="answer stack-tight">
      <p className="block-body">{answer.body}</p>

      {answer.citations.map((citation) => (
        <div key={citation.entryId} className="stack-tight" style={{ marginTop: 'var(--space-3)' }}>
          <span className="citation">
            From “{citation.title}”
            {citation.writtenBy ? `, written by ${citation.writtenBy}` : ''}
          </span>
          {citation.media.length > 0 && (
            <div className="media-grid">
              {citation.media.map((m) => (
                <MediaThumb key={m.id} media={m} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
