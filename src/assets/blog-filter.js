// The complete list is server-rendered; filtering progressively enhances it.
export function selectedTag(search, allowed) {
  const tag = new URLSearchParams(search).get('tag') || '';
  return allowed.has(tag) ? tag : '';
}

export function initTagBrowser(container, win = window) {
  const links = [...container.querySelectorAll('[data-tag]')];
  const entries = [...container.querySelectorAll('[data-entry-tags]')];
  const allowed = new Set(links.map(link => link.dataset.tag));
  const status = container.querySelector('[data-filter-status]');
  function apply() {
    const tag = selectedTag(win.location.search, allowed);
    let count = 0;
    for (const entry of entries) {
      entry.hidden = Boolean(tag && !entry.dataset.entryTags.split('|').includes(tag));
      if (!entry.hidden) count++;
    }
    for (const group of container.querySelectorAll('[data-filter-group]')) {
      const visible = [...group.querySelectorAll('[data-entry-tags]')].filter(entry => !entry.hidden).length;
      group.hidden = visible === 0;
      const counter = group.querySelector('[data-group-count]');
      if (counter) counter.textContent = String(visible);
    }
    for (const link of links) {
      if (link.dataset.tag === tag) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    if (status) status.textContent = `${count} ${status.dataset.countLabel}`;
    const empty = container.querySelector('[data-filter-empty]');
    if (empty) empty.hidden = count > 0;
  }
  container.addEventListener('click', event => {
    const link = event.target.closest('a[data-tag]');
    if (!link || !container.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(win.location.href);
    if (link.dataset.tag) url.searchParams.set('tag', link.dataset.tag);
    else url.searchParams.delete('tag');
    if (url.href !== win.location.href) win.history.pushState(null, '', url);
    apply();
  });
  win.addEventListener('popstate', apply);
  win.addEventListener('pageshow', apply);
  apply();
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-tag-browser]').forEach(container => initTagBrowser(container));
