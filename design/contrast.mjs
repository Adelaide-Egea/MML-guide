// Verifies every colour pairing in tokens.css against its WCAG 2.2 target.
//
// The point of running this rather than asserting it in a document: the previous
// palette's contrast failures were all in a document that said the palette was
// accessible. Run with `npm run test:contrast`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, 'tokens.css'), 'utf8');

/** Tokens are declared twice — once in `:root` and once under the dark theme — so
 *  each block is parsed separately rather than letting the later win. */
function block(selector) {
  const start = css.indexOf(selector);
  assert.ok(start !== -1, `missing block: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const out = {};
  for (const line of css.slice(open + 1, close).split('\n')) {
    const m = line.match(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const luminance = (hex) => {
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = block(':root {');
const dark = block(':root[data-theme="dark"]');

/** [foreground token, background token, minimum]. 4.5 is body text; 3 is large
 *  text and meaning-bearing UI boundaries. */
const PAIRS = [
  ['--ink', '--paper', 4.5],
  ['--ink', '--surface', 4.5],
  ['--ink-muted', '--paper', 4.5],
  ['--ink-muted', '--surface', 4.5],
  ['--brand', '--paper', 4.5],
  ['--brand', '--surface', 4.5],
  ['--amber', '--paper', 4.5],
  ['--critical', '--paper', 4.5],
  ['--critical', '--critical-tint', 4.5],
  ['--ink', '--surface-sunk', 4.5],
  ['--id-teal', '--paper', 4.5],
  ['--id-clay', '--paper', 4.5],
  ['--id-indigo', '--paper', 4.5],
  ['--id-ochre', '--paper', 4.5],
  ['--id-plum', '--paper', 4.5],
  ['--id-moss', '--paper', 4.5],
  ['--hairline-strong', '--paper', 1.5],
];

for (const theme of [
  { name: 'light', tokens: light },
  { name: 'dark', tokens: dark },
]) {
  test(`${theme.name} theme meets its contrast targets`, () => {
    for (const [fg, bg, min] of PAIRS) {
      const a = theme.tokens[fg];
      const b = theme.tokens[bg];
      assert.ok(a, `${theme.name}: ${fg} not defined`);
      assert.ok(b, `${theme.name}: ${bg} not defined`);
      const r = ratio(a, b);
      assert.ok(r >= min, `${theme.name}: ${fg} (${a}) on ${bg} (${b}) is ${r.toFixed(2)}:1, needs ${min}:1`);
    }
  });
}

test('white text is legible on every filled brand surface', () => {
  for (const token of ['--brand', '--critical', '--amber']) {
    const r = ratio('#FFFFFF', light[token]);
    assert.ok(r >= 4.5, `white on ${token} (${light[token]}) is ${r.toFixed(2)}:1`);
  }
});

/** Identity colours must stay apart under the common colour-vision deficiencies,
 *  since six people in one household is a realistic load. This is a backstop, not
 *  the mitigation — the mitigation is that a colour never travels without a symbol.
 */
test('identity colours stay distinguishable under deuteranopia and protanopia', () => {
  const ids = ['--id-teal', '--id-clay', '--id-indigo', '--id-ochre', '--id-plum', '--id-moss'];

  const toLinear = (hex) =>
    [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });

  // Brettel/Viénot-style simulation matrices, applied in linear RGB.
  const SIM = {
    deuteranopia: [
      [0.625, 0.375, 0.0],
      [0.7, 0.3, 0.0],
      [0.0, 0.3, 0.7],
    ],
    protanopia: [
      [0.567, 0.433, 0.0],
      [0.558, 0.442, 0.0],
      [0.0, 0.242, 0.758],
    ],
  };

  const apply = (m, [r, g, b]) => m.map((row) => row[0] * r + row[1] * g + row[2] * b);

  for (const [name, matrix] of Object.entries(SIM)) {
    const seen = ids.map((id) => ({ id, rgb: apply(matrix, toLinear(light[id])) }));
    for (let i = 0; i < seen.length; i += 1) {
      for (let j = i + 1; j < seen.length; j += 1) {
        const d = Math.hypot(...seen[i].rgb.map((v, k) => v - seen[j].rgb[k]));
        assert.ok(
          d > 0.02,
          `${name}: ${seen[i].id} and ${seen[j].id} collapse to near-identical colours (distance ${d.toFixed(4)})`,
        );
      }
    }
  }
});
