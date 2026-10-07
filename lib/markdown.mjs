import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import { katex } from '@mdit/plugin-katex';
import hljs from 'highlight.js';

export const markdown = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return '';
  },
}).use(anchor, { level: [2, 3, 4], slugify: text => 'section-' + text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') }).use(footnote).use(katex, {
  throwOnError: true, trust: false, strict: 'error',
});

// A standalone Markdown image becomes a figure; its optional title is the caption.
markdown.core.ruler.after('inline', 'figures', state => {
  for (let i = 0; i < state.tokens.length - 2; i++) {
    const [open, inline, close] = state.tokens.slice(i, i + 3);
    if (open.type !== 'paragraph_open' || inline.type !== 'inline' ||
        inline.children?.length !== 1 || inline.children[0].type !== 'image') continue;
    const image = inline.children[0];
    open.tag = close.tag = 'figure';
    image.attrSet('loading', 'lazy');
    image.attrSet('decoding', 'async');
    const caption = image.attrGet('title');
    if (caption) {
      const token = new state.Token('html_inline', '', 0);
      token.content = `<figcaption>${markdown.utils.escapeHtml(caption)}</figcaption>`;
      inline.children.push(token);
    }
  }
});

const tableOpen = markdown.renderer.rules.table_open;
markdown.renderer.rules.table_open = (...args) => '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table">' +
  (tableOpen ? tableOpen(...args) : '<table>');
markdown.renderer.rules.table_close = () => '</table></div>';
