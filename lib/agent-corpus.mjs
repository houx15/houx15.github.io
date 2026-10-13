import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import { loadContent } from './content.mjs';

// An explicit public projection: never serialize content directories or frontmatter wholesale.
export async function buildCorpus(root = process.cwd()) {
  const entries = await loadContent(root, { drafts: false });
  const documents = [];
  for (const entry of entries) {
    for (const item of [entry, entry.zh].filter(item => item && !item.draft)) {
      const $ = load(item.html);
      $('script,style,.katex-html').remove();
      $('img').each((_, image) => $(image).replaceWith($('<span>').text($(image).attr('alt') || '')));
      const id = `${item.type}/${item.slug}/${item.lang}`;
      const sections = [];
      let heading = item.title, anchor = '', parts = [];
      const flush = () => {
        const text = parts.join('\n').trim();
        // Bounded chunks keep tool responses small, while keeping the real section link.
        for (let start = 0; start < text.length; start += 2400) {
          sections.push({ id: `${id}:${sections.length}`, heading, url: item.url + (anchor ? `#${anchor}` : ''), text: text.slice(start, start + 2400) });
        }
        parts = [];
      };
      $('body').children().each((_, el) => {
        if (/^h[234]$/.test(el.tagName)) { flush(); heading = $(el).text(); anchor = $(el).attr('id') || ''; }
        else parts.push($(el).text());
      });
      flush();
      documents.push({ id, canonicalId: `${item.type}/${item.slug}`, title: item.title, summary: item.summary,
        type: item.type, language: item.lang, date: item.date, url: item.url,
        tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [], sections });
    }
  }
  return { schemaVersion: 1, revision: createHash('sha256').update(JSON.stringify(documents)).digest('hex').slice(0, 16), documents };
}
