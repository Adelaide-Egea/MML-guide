/** Turn parent-written phone strings into tappable `tel:` links.
 *
 *  Visible text keeps spaces; `href` strips everything except digits and a
 *  leading `+`. Short public numbers (15, 112, 999…) are included.
 */

import type { ReactNode } from 'react';
import { createElement, Fragment } from 'react';

/** Digits (and optional leading +) long enough to dial, with spaces/dashes allowed. */
const PHONE_RE =
  /(\+?\d[\d\s.\-()]{1,18}\d|\b\d{2,4}\b)(?=\s*(?:\)|$|\n|,|;|·|\(|[A-Za-zÀ-ÿ])|\s*$)/g;

export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits) return '';
  // Keep a single leading +, drop other non-digits already stripped.
  const normalized = digits.startsWith('+')
    ? `+${digits.slice(1).replace(/\D/g, '')}`
    : digits.replace(/\D/g, '');
  return normalized ? `tel:${normalized}` : '';
}

/** True when the match looks like a phone rather than a door code / age / time. */
function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 2 || digits.length > 15) return false;
  // Reject times like 18:40 and years.
  if (/^\d{1,2}:\d{2}/.test(raw.trim())) return false;
  if (digits.length <= 4) {
    // Allow well-known emergency shorts only.
    return /^(15|17|18|112|911|999|000|100|101|110|111|117|118|144|061)$/.test(digits);
  }
  return true;
}

export function linkifyPhones(text: string): ReactNode {
  if (!text) return text;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(PHONE_RE.source, PHONE_RE.flags);
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    if (!looksLikePhone(raw)) continue;
    const href = telHref(raw);
    if (!href) continue;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      createElement(
        'a',
        { key: `${match.index}-${href}`, href, className: 'tel-link' },
        raw,
      ),
    );
    last = match.index + raw.length;
  }
  if (last === 0) return text;
  if (last < text.length) nodes.push(text.slice(last));
  return createElement(Fragment, null, ...nodes);
}
