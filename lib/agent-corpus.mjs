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
      let heading = item.title, anchor = '', body = '', links = [];
      const flush = () => {
        const leading = body.length - body.trimStart().length;
        const text = body.trim();
        // Bounded chunks keep tool responses small, while keeping the real section link.
        for (let start = 0; start < text.length; start += 2400) {
          const linkedResources = links.filter(link => link.end > start + leading && link.start < start + leading + 2400)
            .map(({ label, url }) => ({ label, url }));
          sections.push({ id: `${id}:${sections.length}`, heading, url: item.url + (anchor ? `#${anchor}` : ''), text: text.slice(start, start + 2400),
            ...(linkedResources.length ? { linkedResources } : {}) });
        }
        body = ''; links = [];
      };
      // Preserve link boundaries without changing source prose or treating targets as read.
      const append = el => {
        const start = body.length;
        if (el.type === 'text') body += el.data;
        else for (const child of el.children || []) append(child);
        if (el.tagName === 'a' && body.length > start) {
          const href = $(el).attr('href');
          if (!href) return;
          try {
            const url = new URL(href, `https://houx15.github.io${item.url}`);
            if (['https:', 'http:'].includes(url.protocol)) links.push({ start, end: body.length, label: body.slice(start), url: url.href });
          } catch { /* Malformed destinations are not usable resource links. */ }
        }
      };
      $('body').children().each((_, el) => {
        if (/^h[234]$/.test(el.tagName)) { flush(); heading = $(el).text(); anchor = $(el).attr('id') || ''; }
        else { if (body) body += '\n'; append(el); }
      });
      flush();
      documents.push({ id, canonicalId: `${item.type}/${item.slug}`, title: item.title, summary: item.summary,
        type: item.type, language: item.lang, date: item.date, url: item.url,
        tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [], sections });
    }
  }
  return { schemaVersion: 1, revision: createHash('sha256').update(JSON.stringify(documents)).digest('hex').slice(0, 16), documents };
}
