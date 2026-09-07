'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  type Answer,
  type Candidate,
  type Prepared,
  acceptModelAnswer,
  modelContext,
  prepare,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../../../components/Chrome.tsx';
import { MediaThumb } from '../../../../components/MediaField.tsx';
import { useAppState } from '../../../../lib/store.ts';

/** The unreachable-assistant case is its own state rather than a hand-built Answer.
 *  A `grounded` answer with no prose would not survive the contract's own
 *  verification, and manufacturing one here to reuse the renderer would be exactly
 *  the shortcut that verification exists to catch. */
type Shown =
  | { readonly question: string; readonly kind: 'answer'; readonly answer: Answer }
  | { readonly question: string; readonly kind: 'degraded'; readonly candidates: readonly Candidate[] };

export default function AskPage() {
  const { id } = useParams<{ id: string }>();
  const { household, handovers } = useAppState();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);

  const handover = handovers.find((h) => h.id === id);
  if (!handover) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
      </main>
    );
  }

  const subjects = subjectsFor(household, handover);
  const language = typeof navigator === 'undefined' ? 'en' : navigator.language;

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked) return;

    setBusy(true);
    try {
      // The routing decision happens here, before any network call. A
      // safety-critical question is answered from the parent's own words and there
      // is no code path from it to a language model.
      const prepared: Prepared = prepare(subjects, asked, language);

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
        setShown({
          question: asked,
          kind: 'answer',
          answer: acceptModelAnswer(prepared, model, language),
        });
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
      <TopBar title="Ask" back={`/guide/${handover.id}`} />

      <form className="stack" onSubmit={(e) => void ask(e)}>
        <div className="field">
          <label htmlFor="q">What do you need to know?</label>
          <span className="hint">
            Answered only from what was written in this guide. Ask in whatever language you like.
          </span>
          <textarea
            id="q"
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Où sont les sacs de couchage ?"
            autoFocus
          />
        </div>
        <button type="submit" className="btn" disabled={busy || !question.trim()}>
          {busy ? 'Looking…' : 'Ask'}
        </button>
      </form>

      {shown && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <p className="muted">“{shown.question}”</p>
          {shown.kind === 'answer' ? (
            <AnswerView answer={shown.answer} />
          ) : (
            <FromTheGuide candidates={shown.candidates} />
          )}
        </section>
      )}
    </main>
  );
}

/** What the guide says, with no model involved. Also what the whole product falls
 *  back to during a provider outage, which is why the AI is an improvement to this
 *  rather than a dependency of it. */
function FromTheGuide({ candidates }: { candidates: readonly Candidate[] }) {
  return (
    <div className="answer stack-tight">
      <p className="muted">The assistant is unavailable, so here is what the guide says.</p>
      {candidates.map((candidate) => (
        <div key={candidate.entry.id} className="stack-tight" style={{ marginTop: 'var(--space-3)' }}>
          <strong>{candidate.entry.title}</strong>
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

function AnswerView({ answer }: { answer: Answer }) {
  if (answer.kind === 'critical-passthrough') {
    return (
      <div className="critical stack-tight">
        <div className="eyebrow">
          {answer.subjectName ? `${answer.subjectName} — exactly as written` : 'Exactly as written'}
        </div>
        {/* Verbatim, in the language it was written in. A mistranslated allergen is
            the worst thing this product could do, so nothing here is rewritten. */}
        <p className="critical-body" lang={answer.verbatimLanguage}>
          {answer.verbatim}
        </p>
        <p className="muted">
          This is safety information, so it is shown word for word and not translated.
        </p>
      </div>
    );
  }

  if (answer.kind === 'refusal') {
    return (
      <div className="notice stack-tight">
        <strong>That is not in the guide.</strong>
        <p className="muted">
          Rather than guess, this says nothing. If it matters, call the number under &ldquo;who to
          call&rdquo;.
        </p>
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
