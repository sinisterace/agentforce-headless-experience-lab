/**
 * Tiny, dependency-free syntax highlighter for the CLT source inspector. Returns
 * per-line token arrays (never HTML strings) so the component renders plain
 * React spans — no dangerouslySetInnerHTML. Good-enough coloring for JSON, XML,
 * and Apex/JS; CSS/unknown fall back to strings + numbers + punctuation coloring.
 */

export type Lang = 'json' | 'xml' | 'apex' | 'js' | 'css' | 'plain';
export type Tok = { t: string; c?: string };

const KEYWORDS = new Set([
  'global', 'public', 'private', 'protected', 'with', 'without', 'sharing', 'class', 'interface',
  'void', 'return', 'this', 'super', 'new', 'extends', 'implements', 'import', 'export', 'default',
  'get', 'set', 'try', 'catch', 'finally', 'if', 'else', 'for', 'while', 'const', 'let', 'var',
  'String', 'Integer', 'Boolean', 'Decimal', 'Double', 'Long', 'List', 'Map', 'Set',
]);

/** Tokenize a single line for the given language. */
export function highlightLine(line: string, lang: Lang): Tok[] {
  const trimmed = line.trimStart();

  // Whole-line comments.
  if ((lang === 'apex' || lang === 'js') && (/^\/\//.test(trimmed) || /^\*/.test(trimmed) || /^\/\*/.test(trimmed))) {
    return [{ t: line, c: 'tok-comment' }];
  }
  if (lang === 'xml' && /^<!--/.test(trimmed)) return [{ t: line, c: 'tok-comment' }];

  const out: Tok[] = [];
  // Order matters: strings, annotations, numbers, tag delimiters, words, whitespace, punctuation.
  const re = /("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(@\w+)|(-?\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.:-]*|\/?>)|([A-Za-z_$][\w$-]*)|(\s+)|([^\sA-Za-z0-9_$"'@<]+)/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m[1] !== undefined) {
      // string — a JSON key if the next non-space char is a colon
      const after = line.slice(re.lastIndex).trimStart();
      const isKey = lang === 'json' && after.startsWith(':');
      out.push({ t: m[1], c: isKey ? 'tok-key' : 'tok-str' });
    } else if (m[2] !== undefined) {
      out.push({ t: m[2], c: 'tok-annot' });
    } else if (m[3] !== undefined) {
      out.push({ t: m[3], c: 'tok-num' });
    } else if (m[4] !== undefined) {
      out.push({ t: m[4], c: 'tok-tag' });
    } else if (m[5] !== undefined) {
      const w = m[5];
      if (lang === 'json' && (w === 'true' || w === 'false' || w === 'null')) out.push({ t: w, c: 'tok-num' });
      else if ((lang === 'apex' || lang === 'js') && KEYWORDS.has(w)) out.push({ t: w, c: 'tok-kw' });
      else if (lang === 'xml') out.push({ t: w, c: 'tok-attr' });
      else out.push({ t: w });
    } else if (m[6] !== undefined) {
      out.push({ t: m[6] });
    } else if (m[7] !== undefined) {
      out.push({ t: m[7], c: 'tok-punct' });
    }
  }
  return out;
}
