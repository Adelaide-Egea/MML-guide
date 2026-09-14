'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type Answer,
  type Candidate,
  type Prepared,
  acceptModelAnswer,
  modelContext,
  prepare,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { LanguageToggle } from '../../../components/LanguageToggle.tsx';
import type { GuideSnapshot } from '../../../lib/share.ts';

type Shown =
  | { readonly question: string; readonly kind: 'answer'; readonly answer: Answer }
  | {
      readonly question: string;
      readonly kind: 'degraded';
      readonly candidates: readonly Candidate[];
    };

export default function CaregiverAskPage() {
  const [snapshot, setSnapshot] = useState<GuideSnapshot | null>(null);
  const [language, setLanguage] = useState('en');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('mml.caregiver-snapshot');
      if (!raw) return;
      const parsed = JSON.parse(raw) as GuideSnapshot;
      setSnapshot(parsed);
      setLanguage(parsed.handover.language || 'en');
    } catch {
      setSnapshot(null);
    }
  }, []);

  if (!snapshot) {
    return (
      <main className="shell">
        <TopBar title="Ask" back="/c" />
        <p className="muted">
          Open the guide from the link you were sent first, then Ask will work on this phone.
        </p>
        <Link href="/c" className="btn btn-quiet">
          Back to guide
        </Link>
      </main>
    );
  }

  const subjects = subjectsFor(snapshot.household, { ...snapshot.handover, language });

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || !snapshot) return;
    const current = snapshot;
    setBusy(true);
    try {
      const prepared: Prepared = prepare(
        subjects,
        asked,
        language,
        current.household.routine,
      );
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
        setShown({ question: asked, kind: 'degraded', candidates: prepared.candidates });
      }
    } finally {
      setBusy(false);
      setQuestion('');
    }
  }

  return (
    <main className="shell">
      <TopBar title="Ask" back="/c" />

      <LanguageToggle value={language} onChange={setLanguage} />

      <form className="stack" onSubmit={(e) => void ask(e)} style={{ marginTop: 'var(--space-4)' }}>
        <div className="field">
          <label htmlFor="q">What do you need to know?</label>
          <span className="hint">
            Answered only from this guide. Ask in your language — the reply follows the toggle
            above. Safety facts stay in the parent&apos;s words.
          </span>
          <textarea
            id="q"
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Where is the mop? / Où est la serpillière ?"
            autoFocus
          />
        </div>
        <button type="submit" className="btn" disabled={busy || !question.trim()}>
          {busy ? 'Looking…' : 'Ask'}
        </button>
      </form>

      {shown && (
        <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
          <p className="muted">You asked: {shown.question}</p>
          {shown.kind === 'answer' ? (
            <article className="card stack-tight">
              <p className="block-body">{shown.answer.body || shown.answer.verbatim}</p>
            </article>
          ) : (
            <article className="card stack-tight">
              <p className="muted">
                The assistant is unavailable, so here is what was written — unchanged.
              </p>
              {shown.candidates.map((c) => (
                <div key={c.entry.id} className="stack-tight">
                  <strong>{c.entry.title}</strong>
                  <p className="block-body">{c.entry.body}</p>
                </div>
              ))}
            </article>
          )}
        </section>
      )}
    </main>
  );
}
