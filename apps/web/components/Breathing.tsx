'use client';

import { useEffect, useState } from 'react';
import { Mark } from './Mark.tsx';

/** A held breath while something is happening.
 *
 *  This was in the first prototype and got lost in the rebuild, because writing a
 *  guide became instant and there was no wait left to fill. It is back where there
 *  is a real one. A spinner tells you the machine is busy; this tells you that you
 *  can stop holding on for a second, which is the whole feeling the product is
 *  supposed to produce.
 *
 *  Nothing here is fake. It is only ever shown while something is genuinely being
 *  waited on, and it never outlives the work. A progress theatre that keeps going
 *  after the answer has arrived is a lie the product cannot afford anywhere near
 *  the part that answers questions about a child.
 */
export function Breathing({
  lines,
  everyMs = 2800,
}: {
  lines: readonly string[];
  everyMs?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (lines.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), everyMs);
    return () => clearInterval(id);
  }, [lines.length, everyMs]);

  return (
    <div className="breathing" role="status" aria-live="polite">
      <span className="breathing-mark">
        <Mark size={56} />
      </span>
      <p className="breathing-line">{lines[i]}</p>
    </div>
  );
}
