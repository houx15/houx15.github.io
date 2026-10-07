import fs from 'node:fs/promises';
import { markdown } from './lib/markdown.mjs';
import { loadContent, copyPublishedAssets } from './lib/content.mjs';

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  config.setLibrary('md', markdown);
  config.addWatchTarget('content/');
  config.addGlobalData('preview', () => process.env.SITE_DRAFTS === '1');
  config.addGlobalData('year', () => new Date().getUTCFullYear());
  config.addFilter('section', (entries, type) => entries.filter(item => item.type === type));
  config.addFilter('selected', entries => {
    const selected = entries.filter(item => item.featured);
    return (selected.length ? selected : entries).slice(0, 3);
  });
  config.addFilter('firstEntries', entries => entries.slice(0, 4));
  config.addFilter('dateLabel', value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }));
  config.addFilter('xml', value => markdown.utils.escapeHtml(String(value)));
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addPassthroughCopy({ 'node_modules/katex/dist/katex.min.css': 'assets/katex/katex.min.css', 'node_modules/katex/dist/fonts': 'assets/katex/fonts' });
  config.on('eleventy.before', async ({ dir }) => {
    await fs.rm(dir.output, { recursive: true, force: true });
    await fs.mkdir(dir.output, { recursive: true });
    await copyPublishedAssets(await loadContent(), dir.output);
  });
  return { dir: { input: 'src', output: process.env.SITE_DRAFTS === '1' ? '_preview' : '_site' }, markdownTemplateEngine: false, htmlTemplateEngine: 'njk' };
}
