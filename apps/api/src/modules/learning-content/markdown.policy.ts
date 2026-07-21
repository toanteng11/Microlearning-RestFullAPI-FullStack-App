import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const MARKDOWN_MAX_LENGTH = 500_000;

marked.use({
  async: false,
  gfm: true,
  breaks: false,
});

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
] as const;

export function normalizeMarkdownSource(value: string): string {
  return value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim();
}

export function isValidMarkdownSource(value: string): boolean {
  const normalized = normalizeMarkdownSource(value);
  return normalized.length > 0 && normalized.length <= MARKDOWN_MAX_LENGTH;
}

export function renderSanitizedMarkdown(value: string): string {
  const source = normalizeMarkdownSource(value);
  const rendered = marked.parse(source, { async: false });
  return sanitizeHtml(rendered, {
    allowedTags: [...allowedTags],
    allowedSchemes: ['https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    },
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
    },
  });
}
