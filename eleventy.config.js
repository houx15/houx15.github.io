import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { markdown } from './lib/markdown.mjs';
import { loadContent, copyPublishedAssets } from './lib/content.mjs';

const assistantModules = ['portfolio.js', 'knowledge.js', 'assistant-client.js', 'assistant-config.js', 'knowledge-zh.js', 'ui.js', 'navigation.js'];
async function assistantVersion() {
  const sources = await Promise.all(assistantModules.map(name => fs.readFile(`src/assets/${name}`, 'utf8')));
  return createHash('sha256').update(sources.join('\0')).digest('hex').slice(0, 12);
}

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  config.setLibrary('md', markdown);
  config.addWatchTarget('content/');
  config.addGlobalData('preview', () => process.env.SITE_DRAFTS === '1');
  config.addGlobalData('assistantVersion', assistantVersion);
  config.addGlobalData('year', () => new Date().getUTCFullYear());
  config.addGlobalData('stylesheetVersion', async () => createHash('sha256').update(await fs.readFile('src/assets/style.css')).digest('hex').slice(0, 12));
  config.addFilter('isChinese', url => url.startsWith('/zh/'));
  config.addFilter('localized', (entries, locale) => locale.prefix ? entries.filter(item=>item.zh).map(item=>item.zh) : entries);
  config.addFilter('switchLanguage', (url, entries) => {
    if (url.startsWith('/zh/')) return url.slice(3);
    const entry = entries.find(item=>item.url===url);
    return entry && !entry.zh ? `/zh/${entry.type}/` : `/zh${url}`;
  });
  config.addFilter('section', (entries, type) => entries.filter(item => item.type === type));
  config.addFilter('projectBySlug', (entries, slug) => entries.find(item => item.type === 'projects' && item.slug === slug));
  config.addFilter('otherProjects', (entries, projects) => entries.filter(item => !projects.some(project => project.slug === item.slug)));
  config.addFilter('selected', entries => {
    const selected = entries.filter(item => item.featured);
    return (selected.length ? selected : entries).slice(0, 3);
  });
  config.addFilter('firstEntries', entries => entries.slice(0, 4));
  config.addFilter('dateLabel', (value, language = 'en') => new Date(`${value}T12:00:00Z`).toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }));
  config.addFilter('xml', value => markdown.utils.escapeHtml(String(value)));
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addPassthroughCopy({ 'node_modules/katex/dist/katex.min.css': 'assets/katex/katex.min.css', 'node_modules/katex/dist/fonts': 'assets/katex/fonts' });
  config.on('eleventy.before', async ({ dir, runMode }) => {
    if (runMode === 'build') {
      await fs.rm(dir.output, { recursive: true, force: true });
    } else {
      // Eleventy caches created directories during watch mode. Preserve them;
      // remove only entry files so deleted drafts/assets do not linger in preview.
      async function clearFiles(directory) {
        for (const item of await fs.readdir(directory, { withFileTypes: true }).catch(error => {
          if (error.code === 'ENOENT') return [];
          throw error;
        })) {
          const target = path.join(directory, item.name);
          if (item.isDirectory()) await clearFiles(target);
          else await fs.unlink(target);
        }
      }
      for (const section of ['projects', 'reports', 'zh/projects', 'zh/reports']) await clearFiles(path.join(dir.output, section));
    }
    await fs.mkdir(dir.output, { recursive: true });
    await copyPublishedAssets(await loadContent(), dir.output);
  });
  // Version every module edge, not just the entry script: cached imports otherwise
  // keep returning outdated public facts even after a new HTML deployment.
  config.on('eleventy.after', async ({ dir }) => {
    const version = await assistantVersion();
    for (const name of assistantModules) {
      const source = await fs.readFile(`src/assets/${name}`, 'utf8');
      const output = source.replace(/from (['"])\.\/([\w-]+\.js)\1/g, (match, quote, dependency) =>
        assistantModules.includes(dependency) ? `from ${quote}./${dependency}?v=${version}${quote}` : match);
      await fs.writeFile(path.join(dir.output, 'assets', name), output);
    }
  });
  return { dir: { input: 'src', output: process.env.SITE_DRAFTS === '1' ? '_preview' : '_site' }, markdownTemplateEngine: false, htmlTemplateEngine: 'njk' };
}
