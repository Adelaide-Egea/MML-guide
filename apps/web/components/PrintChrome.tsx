import type { CareSubject, ChromeCopy } from '@mml/core';
import { Mark } from './Mark.tsx';

/** Print / PDF masthead — screen-hidden; the fridge copy’s brand moment. */
export function PrintMasthead({
  chrome,
  caregiverName,
  subjects,
}: {
  chrome: ChromeCopy;
  caregiverName: string;
  subjects: readonly CareSubject[];
}) {
  const who = caregiverName.trim() || chrome.yourGuide;
  const names = subjects.map((s) => s.name).filter(Boolean);
  const title =
    names.length === 0
      ? chrome.guide
      : names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} & ${names[1]}`
          : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;

  return (
    <header className="print-masthead print-only">
      <div className="print-masthead-brand">
        <Mark size={28} />
        <span className="print-masthead-wordmark">Domela</span>
      </div>
      {subjects.length > 0 && (
        <div className="print-masthead-marks" aria-hidden="true">
          {subjects.map((s) => (
            <span key={s.id} className="print-masthead-mark">
              {s.identity.symbol}
            </span>
          ))}
        </div>
      )}
      <h1 className="print-masthead-names">{title}</h1>
      <p className="print-masthead-for">{chrome.printGuideFor(who)}</p>
      <p className="print-masthead-intro">{chrome.printIntro}</p>
      <div className="print-masthead-rule" aria-hidden="true" />
    </header>
  );
}

export function PrintFooter({ chrome }: { chrome: ChromeCopy }) {
  return <p className="print-colophon print-only">{chrome.printFooter}</p>;
}
