/**
 * DESIGN.md YAML frontmatter token parser.
 * LD-015: YAML frontmatter is the authoritative source.
 * Text section after closing '---' is intentionally ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve from this file: apps/web/src/lib/ → root → ui/aurelian_dark/DESIGN.md
const DEFAULT_DESIGN_PATH = path.resolve(
  __dirname,
  '../../../../ui/aurelian_dark/DESIGN.md'
);

/**
 * Parse design tokens from DESIGN.md content string.
 * YAML frontmatter wins over text section (LD-015) — text after closing '---' is ignored.
 * Throws `Error('YAML frontmatter parse failed at L<n>: ...')` if corrupt.
 *
 * @param {string} content - Full file content
 * @param {string} [filename] - Used in error messages
 * @returns {{ colors: Record<string,string>, typography: Record<string,Record<string,string>>, rounded: Record<string,string>, spacing: Record<string,string> }}
 */
export function parseTokensFromContent(content, filename = '<unknown>') {
  const lines = content.split('\n');

  if (!lines[0] || lines[0].trim() !== '---') {
    throw new Error(
      `YAML frontmatter parse failed at L1: missing opening '---' in ${filename}`
    );
  }

  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx === -1) {
    throw new Error(
      `YAML frontmatter parse failed at L${lines.length}: missing closing '---' in ${filename}`
    );
  }

  const yamlContent = lines.slice(1, closingIdx).join('\n');

  /** @type {unknown} */
  let parsed;
  try {
    parsed = yaml.load(yamlContent);
  } catch (/** @type {any} */ err) {
    const lineNum =
      err.mark?.line != null
        ? err.mark.line + 2 // +1 for 0-based, +1 for skipped opening '---'
        : '?';
    throw new Error(`YAML frontmatter parse failed at L${lineNum}: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `YAML frontmatter parse failed at L1: empty or invalid YAML in ${filename}`
    );
  }

  const data = /** @type {Record<string, unknown>} */ (parsed);

  return {
    colors: /** @type {Record<string,string>} */ (data['colors'] ?? {}),
    typography: /** @type {Record<string,Record<string,string>>} */ (data['typography'] ?? {}),
    rounded: /** @type {Record<string,string>} */ (data['rounded'] ?? {}),
    spacing: /** @type {Record<string,string>} */ (data['spacing'] ?? {}),
  };
}

/**
 * Parse design tokens from a DESIGN.md file on disk.
 *
 * @param {string} [filePath] - Defaults to the workspace DESIGN.md
 * @returns {{ colors: Record<string,string>, typography: Record<string,Record<string,string>>, rounded: Record<string,string>, spacing: Record<string,string> }}
 */
export function parseTokensFromFile(filePath = DEFAULT_DESIGN_PATH) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (/** @type {any} */ err) {
    throw new Error(
      `YAML frontmatter parse failed at L1: cannot read '${filePath}': ${err.message}`
    );
  }
  return parseTokensFromContent(content, filePath);
}

export default parseTokensFromFile;
