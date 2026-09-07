// The app is a single HTML file with no build step, so there is nothing to import.
// These helpers lift named functions out of the inline script and evaluate them in
// isolation, which is enough to regression-test the pure logic that has broken
// before without introducing a bundler.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readApp() {
  return readFileSync(join(root, 'index.html'), 'utf8');
}

export function readFile(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

// Pulls `function name(...) { ... }` out of the source. Hand-rolling a brace
// matcher means reimplementing enough of a JS lexer to tell a regex literal from a
// division sign, so the parser is asked instead: extend the slice to each following
// `}` until it compiles. The first slice that parses is the function.
export function extractFunction(source, name) {
  const signature = new RegExp(`function\\s+${name}\\s*\\(`);
  const start = source.search(signature);
  if (start === -1) throw new Error(`Could not find function ${name}() in the source`);

  let end = source.indexOf('{', start);
  if (end === -1) throw new Error(`Malformed function ${name}()`);

  for (let attempts = 0; attempts < 5000; attempts += 1) {
    end = source.indexOf('}', end + 1);
    if (end === -1) break;

    const candidate = source.slice(start, end + 1);
    try {
      // eslint-disable-next-line no-new-func
      new Function(`${candidate}; return ${name};`);
      return candidate;
    } catch {
      // Not a complete function yet — keep extending.
    }
  }

  throw new Error(`Could not find a parseable body for ${name}()`);
}

export function loadFunctions(source, names) {
  const declarations = names.map((name) => extractFunction(source, name)).join('\n');
  const factory = new Function(`${declarations}\nreturn { ${names.join(', ')} };`);
  return factory();
}
