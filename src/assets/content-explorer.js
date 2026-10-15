import { createContentTools } from './agent-tools.js';

// Both tool results and local previews use these renderers. No model HTML is executed.
export function renderContentBlock(document, block, { language = 'en', onQuestion = () => {} } = {}) {
  const zh = language === 'zh-CN';
  const root = document.createElement('section');
  root.className = `content-block content-${block.type}`;
  const add = (parent, tag, text) => { const el = document.createElement(tag); el.textContent = text; parent.append(el); return el; };
  if (block.type === 'questions') {
    for (const item of block.items) {
      const button = add(root, 'button', item.label); button.type = 'button';
      button.addEventListener('click', () => onQuestion(item.query));
    }
    return root;
  }
  if (!['post_cards', 'publication_timeline'].includes(block.type)) throw new Error('Unsupported block');
  if (block.type === 'publication_timeline') add(root, 'p', block.dateKind === 'content' ? (zh ? '内容时间 · 项目起点、写作或发表日期，不代表持续时间' : 'Content dates · project origins, writing or publication, not duration') : (zh ? '内容发布日期 · 不代表项目起止时间' : 'Publication dates · not project start or end dates'));
  const list = add(root, 'ol', '');
  for (const item of block.items) {
    if (!/^\/(?:zh\/)?(?:projects|reports|notes|blog)\/[a-z0-9-]+\/$/.test(item.url)) throw new Error('Invalid card URL');
    const row = add(list, 'li', '');
    const time = add(row, 'time', item.date); time.dateTime = item.date;
    const kind = item.dateKind === 'project-origin' ? (zh ? '项目起点' : 'Project origin') : item.dateKind === 'authored' ? (zh ? '写作日期' : 'Written') : '';
    if (kind || item.status) add(row, 'small', [kind, item.status === '想法' ? (zh ? '想法' : 'Concept') : item.status === '已完成' ? (zh ? '已完成' : 'Completed') : ''].filter(Boolean).join(' · '));
    const link = add(row, 'a', item.title); link.href = item.url;
    if (block.type === 'post_cards') add(row, 'p', item.summary);
  }
  return root;
}

export function initContentExplorer(document) {
  const root = document.querySelector('[data-content-explorer]');
  if (!root) return;
  const language = document.documentElement.lang, zh = language === 'zh-CN';
  const form = root.querySelector('form'), input = root.querySelector('input'), status = root.querySelector('[data-explorer-status]');
  const output = root.querySelector('[data-explorer-results]'), starters = root.querySelector('[data-explorer-starters]');
  let toolsPromise;
  const getTools = () => toolsPromise ||= fetch(root.dataset.index, { credentials: 'omit' }).then(response => {
    if (!response.ok) throw new Error('Index unavailable'); return response.json();
  }).then(createContentTools).catch(error => { toolsPromise = null; throw error; });
  const options = { language, onQuestion: query => { input.value = query; form.requestSubmit(); } };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = input.value.trim(); if (!query) return;
    const submit = form.querySelector('button'); submit.disabled = true;
    status.textContent = zh ? '正在检索…' : 'Searching…';
    try {
      const tools = await getTools();
      const result = tools.search_content({ query, language, type: root.querySelector('select').value || undefined, limit: 10 });
      output.replaceChildren();
      status.textContent = zh ? `找到 ${result.total} 篇内容，显示前 ${result.results.length} 篇。这是原文检索，不是 AI 生成回答。` : `${result.total} documents found; showing ${result.results.length}. Source retrieval, not an AI-generated answer.`;
      for (const hit of result.results) {
        const article = document.createElement('article'); article.className = 'content-search-hit';
        const link = document.createElement('a'); link.href = hit.sourceUrl; link.textContent = `${hit.title} · ${hit.heading}`;
        const excerpt = document.createElement('p'); excerpt.textContent = hit.excerpt;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = zh ? '阅读命中章节' : 'Read matching section';
        button.addEventListener('click', () => {
          const data = tools.read_content({ id: hit.id, sectionId: hit.sectionId });
          excerpt.textContent = data.sections.map(section => section.text).join('\n\n'); button.hidden = true;
          const related = tools.find_related_posts({ id: hit.id, language });
          if (related.length) article.append(renderContentBlock(document, tools.show_post_cards({ ids: related.map(item => item.id) }), options));
        });
        article.append(link, excerpt, button); output.append(article);
      }
    } catch { status.textContent = zh ? '检索暂时不可用，请重试或浏览内容目录。' : 'Search unavailable. Please retry or browse the content pages.'; }
    finally { submit.disabled = false; }
  });
  root.querySelector('[data-explorer-timeline]').addEventListener('click', async () => {
    try {
      const tools = await getTools();
      output.replaceChildren(renderContentBlock(document, tools.query_timeline({ language }), options));
      status.textContent = zh ? '最近发布的内容，最多显示 12 篇。' : 'Recent publications, up to 12 documents.';
    } catch { status.textContent = zh ? '无法加载时间轴，请重试。' : 'Unable to load the timeline. Please retry.'; }
  });
  // Load only on interaction; the full corpus is not downloaded on every site visit.
  root.addEventListener('toggle', async () => {
    if (!root.open || starters.childElementCount) return;
    try { const tools = await getTools(); starters.append(renderContentBlock(document, tools.suggest_questions({ language }), options)); }
    catch { status.textContent = zh ? '索引加载失败，可以提交搜索重试。' : 'Index unavailable. Submit a search to retry.'; }
  });
}
