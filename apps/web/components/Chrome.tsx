'use client';

import Link from 'next/link';
import type { CareSubject } from '@mml/core';
import { identityPair } from '../lib/identity.ts';
import { Mark } from './Mark.tsx';

export function TopBar({ title, back }: { title: string; back?: string }) {
  return (
    <header className="topbar no-print">
      {back ? (
        <Link href={back} className="btn btn-quiet btn-inline" aria-label="Back">
          ←
        </Link>
      ) : (
        <span className="mark">
          <Mark size={30} />
        </span>
      )}
      <h1 className="grow">{title}</h1>
    </header>
  );
}

/** Colour plus symbol, always together — tint ground, matching ink. */
export function Badge({ subject, size = 40 }: { subject: CareSubject; size?: number }) {
  const { tint, ink } = identityPair(subject.identity.colourToken);
  return (
    <span
      className="badge"
      style={{
        background: `var(${tint})`,
        color: `var(${ink})`,
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
      aria-hidden="true"
    >
      {subject.identity.symbol}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
