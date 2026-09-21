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
  // Find matching close for nested-safe shallow parse (no nests in our tokens).
  const close = css.indexOf('}', open);
  const out = {};
  for (const line of css.slice(open + 1, close).split('\n')) {
    const hex = line.match(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/);
    if (hex) out[hex[1]] = hex[2];
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

/** Resolve a token that may alias another via var(--name). */
function resolve(tokens, name, depth = 0) {
  const v = tokens[name];
  if (!v) return undefined;
  if (v.startsWith('#')) return v;
  const m = v.match(/^var\((--[\w-]+)\)$/);
  if (m && depth < 4) return resolve(tokens, m[1], depth + 1);
  return undefined;
}

// Re-parse allowing var() aliases for the light block.
function blockWithVars(selector) {
  const start = css.indexOf(selector);
  assert.ok(start !== -1, `missing block: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const out = {};
  for (const line of css.slice(open + 1, close).split('\n')) {
    const hex = line.match(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/);
    if (hex) out[hex[1]] = hex[2];
    const alias = line.match(/(--[\w-]+)\s*:\s*var\((--[\w-]+)\)/);
    if (alias) out[alias[1]] = `var(${alias[2]})`;
  }
  return out;
}

const lightRaw = blockWithVars(':root {');
const darkRaw = blockWithVars(":root[data-theme='dark']");
// Fallback if dark uses double quotes in file
const dark =
  Object.keys(darkRaw).length > 5 ? darkRaw : blockWithVars(':root[data-theme="dark"]');
const light = lightRaw;

/** [foreground token, background token, minimum]. 4.5 is body text; 3 is large
 *  text and meaning-bearing UI boundaries. */
const PAIRS = [
  ['--ink', '--paper', 4.5],
  ['--ink', '--surface', 4.5],
  ['--ink', '--surface-warm', 4.5],
  ['--ink-muted', '--paper', 4.5],
  ['--ink-muted', '--surface', 4.5],
  ['--brand-deep', '--paper', 4.5],
  ['--brand-deep', '--surface', 4.5],
  ['--critical', '--paper', 4.5],
  ['--critical', '--critical-tint', 4.5],
  ['--ink', '--surface-sunk', 4.5],
  ['--ink', '--brand-tint', 4.5],
  ['--id-dusk-ink', '--id-dusk', 4.5],
  ['--id-sage-ink', '--id-sage', 4.5],
  ['--id-terracotta-ink', '--id-terracotta', 4.5],
  ['--id-clay-ink', '--id-clay', 4.5],
  ['--id-honey-ink', '--id-honey', 4.5],
  ['--id-plum-ink', '--id-plum', 4.5],
  ['--hairline-strong', '--paper', 1.5],
  ['--done', '--surface', 3],
];

for (const theme of [
  { name: 'light', tokens: light },
  { name: 'dark', tokens: dark },
]) {
  test(`${theme.name} theme meets its contrast targets`, () => {
    for (const [fg, bg, min] of PAIRS) {
      const a = resolve(theme.tokens, fg) ?? theme.tokens[fg];
      const b = resolve(theme.tokens, bg) ?? theme.tokens[bg];
      assert.ok(a && a.startsWith('#'), `${theme.name}: ${fg} not defined as hex`);
      assert.ok(b && b.startsWith('#'), `${theme.name}: ${bg} not defined as hex`);
      const r = ratio(a, b);
      assert.ok(
        r >= min,
        `${theme.name}: ${fg} (${a}) on ${bg} (${b}) is ${r.toFixed(2)}:1, needs ${min}:1`,
      );
    }
  });
}

test('label text is legible on every filled brand surface', () => {
  for (const theme of [
    { name: 'light', tokens: light },
    { name: 'dark', tokens: dark },
  ]) {
    const label = resolve(theme.tokens, '--on-brand') ?? theme.tokens['--on-brand'];
    const brand = resolve(theme.tokens, '--brand') ?? theme.tokens['--brand'];
    assert.ok(label?.startsWith('#'), `${theme.name}: --on-brand not defined`);
    const r = ratio(label, brand);
    assert.ok(r >= 4.5, `${theme.name}: --on-brand on --brand is ${r.toFixed(2)}:1`);
  }
  {
    const critical = resolve(light, '--critical');
    const r = ratio('#FFFFFF', critical);
    assert.ok(r >= 4.5, `white on --critical (${critical}) is ${r.toFixed(2)}:1`);
  }
  {
    const deep = resolve(light, '--brand-deep');
    const paper = resolve(light, '--paper');
    const r = ratio(deep, paper);
    assert.ok(r >= 4.5, `honey-deep on linen is ${r.toFixed(2)}:1, needs 4.5:1`);
  }
});

/** Identity ink colours must stay apart under common colour-vision deficiencies. */
test('identity colours stay distinguishable under deuteranopia and protanopia', () => {
  const ids = [
    '--id-dusk-ink',
    '--id-sage-ink',
    '--id-terracotta-ink',
    '--id-clay-ink',
    '--id-honey-ink',
    '--id-plum-ink',
  ];

  const toLinear = (hex) =>
    [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });

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
    const seen = ids.map((id) => ({
      id,
      rgb: apply(matrix, toLinear(resolve(light, id))),
    }));
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
