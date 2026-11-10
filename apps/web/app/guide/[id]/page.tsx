'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  type CareSubject,
  type ChromeCopy,
  type GuideBlock,
  UnsafeGuideError,
  buildVerifiedGuide,
  chromeFor,
  localizeGuideHeading,
  mergeRoutineRows,
  routineItemLabel,
  subjectsFor,
} from '@mml/core';
import { TopBar } from '../../../components/Chrome.tsx';
import { LanguageToggle } from '../../../components/LanguageToggle.tsx';
import { BulletRecapEditor } from '../../../components/BulletRecapEditor.tsx';
import { MediaThumb } from '../../../components/MediaField.tsx';
import { PrintFooter, PrintMasthead } from '../../../components/PrintChrome.tsx';
import { buildShareUrl } from '../../../lib/share.ts';
import {
  caregiverMessage,
  isShareCancel,
  mailHref,
  smsHref,
  whatsappHref,
} from '../../../lib/send-link.ts';
import { useActions, useAppState } from '../../../lib/store.ts';
import { linkifyPhones } from '../../../lib/tel.ts';
import { track } from '../../../lib/trial.ts';

/** Whose part of the guide is on screen. `all` is the default and the one a guide
 *  is printed in; the rest exist because a caregiver mid-task is doing one thing for
 *  one of them and should not be reading past the other two. */
type Focus = 'all' | string;

export default function GuidePage() {
  const { id } = useParams<{ id: string }>();
  const { households, household: active, handovers, trips } = useAppState();
  const [focus, setFocus] = useState<Focus>('all');
  const [acknowledged, setAcknowledged] = useState(false);
  const [shareState, setShareState] = useState<
    'idle' | 'working' | 'ready' | 'failed' | 'too-large'
  >('idle');
  /** The finished caregiver link. Shown with tap-again buttons, because phones
   *  refuse to open the share sheet once the first tap has "expired". */
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** Explicit opt-in: photos only travel with the link when the parent ticks this. */
  const [includePhotos, setIncludePhotos] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const actions = useActions();

  const handover = handovers.find((h) => h.id === id);
  // A guide names the household it belongs to, so a link to one opens correctly
  // whichever household happens to be selected.
  const household = households.find((h) => h.id === handover?.householdId) ?? active;

  // Acknowledgement is per guide and per device: it means "this caregiver, on this
  // phone, has seen the allergies". It is deliberately not synced or shared, because
  // one person reading it is not the next person reading it.
  const ackKey = `mml.safety-ack.${id}`;
  useEffect(() => {
    setAcknowledged(window.localStorage.getItem(ackKey) === '1');
  }, [ackKey]);

  useEffect(() => {
    if (handover) track('guide');
  }, [handover]);

  // buildVerifiedGuide builds from facts, applies enrichment, then asserts that
  // nothing safety-critical was lost or altered on the way. It throws rather than
  // rendering a guide that quietly dropped an allergy — a guide that refuses to
  // render is recoverable and one that silently omits is not.
  const result = useMemo(() => {
    if (!handover) return null;
    try {
      return { guide: buildVerifiedGuide(household, handover), error: null as string | null };
    } catch (error) {
      return {
        guide: null,
        error:
          error instanceof UnsafeGuideError
            ? error.message
            : 'This guide could not be built safely.',
      };
    }
  }, [household, handover]);

  if (!handover || !result) {
    return (
      <main className="shell">
        <TopBar title="Not found" back="/" />
        <p className="muted">This guide has been removed.</p>
      </main>
    );
  }

  if (result.error || !result.guide) {
    return (
      <main className="shell">
        <TopBar title="Guide" back="/" />
        <div className="critical stack-tight">
          <div className="eyebrow">Not safe to show</div>
          <p>{result.error}</p>
          <p className="muted">
            Nothing has been lost — this is the check that stops a guide going out with something
            important missing.
          </p>
        </div>
      </main>
    );
  }

  const guide = result.guide;
  const subjects = subjectsFor(household, handover);
  const chrome = chromeFor(handover.language || 'en');

  // Filtering never hides a safety-critical block. Narrowing to the dog must not be
  // a way to stop being told about the child's EpiPen, so `critical` is taken from
  // the whole guide and only the readable content below it responds to the filter.
  const critical = guide.blocks.filter((b) => b.critical);
  const inFocus = (b: GuideBlock) =>
    focus === 'all' || b.subjectId === focus || b.subjectId === undefined;
  const rest = guide.blocks.filter((b) => !b.critical && inFocus(b));
  const routine = guide.routine.filter(
    (r) => focus === 'all' || r.appliesTo === focus || r.appliesTo === 'all',
  );
  const focused = subjects.find((s) => s.id === focus);

  // Every heading is "Pomme (Labrador, 7) — Walks", which is right in a whole guide
  // and pure repetition once the filter above already says Pomme. Known English
  // prompt titles (Screens, Potty…) remap with the care language; custom titles stay.
  const heading = (block: GuideBlock) => {
    const raw =
      focused && block.subjectId === focused.id
        ? block.heading.split(' — ').slice(1).join(' — ') || block.heading
        : block.heading;
    return localizeGuideHeading(raw, chrome);
  };

  return (
    <main className="shell guide-print">
      <TopBar title={handover.caregiverName || chrome.guide} back="/" />

      <PrintMasthead
        chrome={chrome}
        caregiverName={handover.caregiverName}
        subjects={subjects}
      />

      <div className="stack no-print" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="muted">
          {chrome.forName(handover.caregiverName || 'whoever is looking after things')}
          {handover.caregiverRelationship ? (
            <>
              <br />
              {handover.caregiverRelationship}
            </>
          ) : null}
        </p>
        <LanguageToggle
          value={handover.language}
          onChange={(language) => actions.saveHandover({ ...handover, language })}
        />
        <label className="row no-print" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => {
              setIncludePhotos(e.target.checked);
              setShareState('idle');
              setShareNote(null);
              setShareUrl(null);
              setCopied(false);
            }}
          />
          <span>
            {chrome.includePhotos}
            <span className="muted" style={{ display: 'block' }}>
              {chrome.includePhotosHint}
            </span>
          </span>
        </label>
        <div className="share-actions">
          <button
            type="button"
            className="btn"
            disabled={shareState === 'working'}
            onClick={() => {
              void (async () => {
                setShareState('working');
                setShareNote(null);
                setShareUrl(null);
                setCopied(false);
                let result: Awaited<ReturnType<typeof buildShareUrl>>;
                try {
                  const trip = handover.tripId
                    ? trips.find((t) => t.id === handover.tripId) ?? null
                    : null;
                  result = await buildShareUrl(household, handover, {
                    includePhotos,
                    trip,
                  });
                } catch {
                  setShareState('failed');
                  return;
                }
                if (!result.ok) {
                  setShareState('too-large');
                  setShareNote(
                    'Those photos make the link too big to send. Untick photos and send the text, or remove a few pictures and try again.',
                  );
                  return;
                }
                let note =
                  includePhotos && result.omittedVideos > 0
                    ? `${result.photoCount} photo${result.photoCount === 1 ? '' : 's'} included. Short videos stay on this phone; they are too large for a link.`
                    : includePhotos
                      ? result.photoCount === 0
                        ? 'No photos on this guide yet. The link is text only.'
                        : `${result.photoCount} photo${result.photoCount === 1 ? '' : 's'} included. Anyone with the link can see them.`
                      : 'Text only. Photos stayed on this phone.';
                note = result.short
                  ? `${note} Expires in 14 days.`
                  : `${note} Could not shorten the link, so this one is long. It still works.`;
                // The link exists now, so this is never a failure from here on.
                setShareUrl(result.url);
                setShareState('ready');
                setShareNote(`Link ready. Choose how to send it. ${note}`);
                track('share');
                // iPhone refuses share after an await (the tap has expired). Android
                // Chrome usually still opens the sheet. The buttons below cover both.
                const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (!ios && typeof navigator.share === 'function') {
                  try {
                    const text = caregiverMessage(handover.caregiverName ?? '', result.url);
                    await navigator.share({
                      title: `Guide for ${handover.caregiverName || 'caregiver'}`,
                      text,
                      url: result.url,
                    });
                    setShareNote(`Sent. ${note}`);
                  } catch {
                    // Refused or closed. The send buttons are on screen.
                  }
                }
              })();
            }}
          >
            {chrome.sendToCaregiver}
          </button>
          <Link href={`/guide/${handover.id}/ask`} className="btn btn-secondary">
            {chrome.askAboutAnything}
          </Link>
        </div>
        {shareUrl ? (
          <div className="stack no-print" style={{ gap: 'var(--space-2)' }}>
            <div className="share-actions">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const text = caregiverMessage(handover.caregiverName ?? '', shareUrl);
                    void navigator
                      .share({
                        title: `Guide for ${handover.caregiverName || 'caregiver'}`,
                        text,
                        url: shareUrl,
                      })
                      .catch((error: unknown) => {
                        if (!isShareCancel(error)) {
                          setShareNote('Your phone blocked the share menu. Use WhatsApp, Text or Copy link.');
                        }
                      });
                  }}
                >
                  Share link
                </button>
              ) : null}
              <a
                className="btn btn-secondary"
                href={whatsappHref(caregiverMessage(handover.caregiverName ?? '', shareUrl))}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="btn btn-secondary"
                href={smsHref(caregiverMessage(handover.caregiverName ?? '', shareUrl))}
              >
                Text message
              </a>
              <a
                className="btn btn-secondary"
                href={mailHref(
                  `Guide for ${handover.caregiverName || 'you'}`,
                  caregiverMessage(handover.caregiverName ?? '', shareUrl),
                )}
              >
                Email
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void (async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      return;
                    } catch {
                      // Older phones and in-app browsers: fall back to selecting the box.
                    }
                    const box = document.getElementById('caregiver-link') as HTMLInputElement | null;
                    box?.focus();
                    box?.select();
                    let ok = false;
                    try {
                      ok = document.execCommand('copy');
                    } catch {
                      ok = false;
                    }
                    if (ok) setCopied(true);
                    else setShareNote('Press and hold the link below, then tap Copy.');
                  })();
                }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <input
              id="caregiver-link"
              className="input"
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Caregiver link"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        ) : null}
        <p className="hint no-print">
          The link holds this guide for 14 days, including any health details you wrote, such as
          allergies or medicines. Only send it to the person who is looking after them.
        </p>
        <p className="hint no-print" aria-live="polite">
          {shareState === 'working'
            ? chrome.preparingLink
            : shareState === 'too-large'
              ? shareNote
              : shareState === 'failed'
                ? chrome.couldNotShare
                : shareNote
                  ? shareNote
                  : chrome.sendHint}
        </p>
        <BulletRecapEditor
          chrome={chrome}
          handover={handover}
          blocks={rest}
          onSave={(entryRecaps) => actions.saveHandover({ ...handover, entryRecaps })}
        />
      </div>

      <SafetyBlock
        chrome={chrome}
        blocks={critical}
        acknowledged={acknowledged}
        onAcknowledge={() => {
          window.localStorage.setItem(ackKey, '1');
          setAcknowledged(true);
        }}
      />

      {subjects.length > 1 && (
        <FocusFilter chrome={chrome} subjects={subjects} focus={focus} onChange={setFocus} />
      )}

      {routine.length > 0 && (
        <section className="card rows print-schedule" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="rows-head">
            <span className="eyebrow">
              {focused
                ? focused.kind === 'place'
                  ? chrome.whileYouAreHereFor(focused.name)
                  : chrome.aTypicalDayFor(focused.name)
                : subjects.every((s) => s.kind === 'place')
                  ? chrome.whileYouAreHere
                  : chrome.aTypicalDay}
            </span>
          </div>
          {mergeRoutineRows(routine).map(({ item, appliesToIds }) => {
            const names =
              focus === 'all' && !appliesToIds.includes('all')
                ? appliesToIds
                    .map((id) => subjects.find((s) => s.id === id)?.name)
                    .filter((n): n is string => Boolean(n))
                : [];
            const title = routineItemLabel(item, chrome.routineKinds);
            return (
              <div key={appliesToIds.join('-') + ':' + item.id} className="routine-item">
                <span className="routine-time">
                  {item.time ??
                    (item.priority === 'nice'
                      ? chrome.nice
                      : item.priority === 'must'
                        ? chrome.must
                        : '—')}
                </span>
                <span>
                  <strong>{title}</strong>
                  {item.section && (
                    <span className="muted" style={{ display: 'block' }}>
                      {item.section}
                    </span>
                  )}
                  {names.length > 0 && (
                    <span className="muted" style={{ display: 'block' }}>
                      {chrome.forNames(names)}
                    </span>
                  )}
                  {item.product && (
                    <span className="routine-note">{chrome.useProduct(item.product)}</span>
                  )}
                  {item.notes && <span className="routine-note">{item.notes}</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <section className="stack print-notes">
        {rest.map((block) => (
          <article key={block.id} className="card stack-tight print-note">
            <strong>{heading(block)}</strong>
            {block.body && <p className="block-body">{linkifyPhones(block.body)}</p>}
            {block.media.length > 0 && (
              <div className="media-grid">
                {block.media.map((m) => (
                  <MediaThumb key={m.id} media={m} />
                ))}
              </div>
            )}
          </article>
        ))}
        {rest.length === 0 && routine.length === 0 && (
          <p className="muted">{chrome.nothingWritten}</p>
        )}
      </section>

      {handover.signOff && (
        <p className="print-signoff muted" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          {handover.signOff}
        </p>
      )}

      <PrintFooter chrome={chrome} />

      <div className="row no-print" style={{ marginTop: 'var(--space-6)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            track('print');
            window.print();
          }}
        >
          {chrome.printOrSavePdf}
        </button>
      </div>
    </main>
  );
}

function FocusFilter({
  chrome,
  subjects,
  focus,
  onChange,
}: {
  chrome: ChromeCopy;
  subjects: readonly CareSubject[];
  focus: Focus;
  onChange: (focus: Focus) => void;
}) {
  return (
    <div className="chips no-print" style={{ marginBottom: 'var(--space-4)' }}>
      <button
        type="button"
        className="chip"
        aria-pressed={focus === 'all'}
        onClick={() => onChange('all')}
      >
        {chrome.everyone}
      </button>
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          className="chip"
          aria-pressed={focus === subject.id}
          onClick={() => onChange(subject.id)}
        >
          {/* The same symbol and colour the subject carries everywhere else, so the
              filter is recognised rather than read. Handed to CSS as a variable so
              the selected state can override it without fighting an inline style. */}
          <span
            className="mark"
            aria-hidden="true"
            style={{ '--mark': `var(${subject.identity.colourToken})` } as React.CSSProperties}
          >
            {subject.identity.symbol}
          </span>
          {subject.name}
        </button>
      ))}
    </div>
  );
}

/** Allergies, medication and emergency instructions.
 *
 *  Two things are true at once: this must be read before anything else, and a wall
 *  of red at the top of every screen stops being read at all. So it opens loud,
 *  asks to be acknowledged once, and then holds its place as a single quiet line
 *  that reopens on tap. The content is never removed, only folded — and printing
 *  always gets the full text regardless of what was tapped on screen.
 */
function SafetyBlock({
  chrome,
  blocks,
  acknowledged,
  onAcknowledge,
}: {
  chrome: ChromeCopy;
  blocks: readonly GuideBlock[];
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  const [reopened, setReopened] = useState(false);
  if (blocks.length === 0) return null;

  const open = !acknowledged || reopened;

  const body = blocks.map((block) => (
    <div key={block.id} className="stack-tight">
      <strong>{localizeGuideHeading(block.heading, chrome)}</strong>
      <p className="critical-body">{linkifyPhones(block.body)}</p>
    </div>
  ));

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="safety safety-collapsed no-print"
          onClick={() => setReopened(true)}
          aria-expanded={false}
        >
          <span className="safety-dot" aria-hidden="true" />
          <span className="grow">{chrome.allergiesMedicationEmergencies}</span>
          <span className="muted">{chrome.readShow}</span>
        </button>
        {/* Folded on screen is not folded on paper. The printed guide is the copy
            that ends up on the fridge, and it carries the whole thing. */}
        <section className="safety stack print-only">{body}</section>
      </>
    );
  }

  return (
    <section className="safety stack" aria-labelledby="safety-heading">
      <div className="row">
        <span className="safety-dot" aria-hidden="true" />
        <span id="safety-heading" className="eyebrow safety-eyebrow grow">
          {chrome.readThisFirst}
        </span>
      </div>

      {body}

      {acknowledged ? (
        <button type="button" className="btn btn-quiet no-print" onClick={() => setReopened(false)}>
          {chrome.hideAgain}
        </button>
      ) : (
        <button type="button" className="btn btn-secondary no-print" onClick={onAcknowledge}>
          {chrome.iHaveReadThis}
        </button>
      )}
    </section>
  );
}
