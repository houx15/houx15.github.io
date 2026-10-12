export function matchesNote(text, query) {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const haystack = normalize(text);
  return normalize(query).split(' ').filter(Boolean).every(term => haystack.includes(term));
}

export function initNotes(root) {
  if (!root) return;
  const items = [...root.querySelectorAll('[data-note]')];
  const years = [...root.querySelectorAll('[data-year]')];
  const input = root.querySelector('input');
  const more = root.querySelector('[data-more]');
  const empty = root.querySelector('[data-no-results]');
  const count = root.querySelector('[data-count]');
  const chinese = root.dataset.locale === 'zh-CN';
  let limit = 30;
  let timer;
  input.value = new URL(location.href).searchParams.get('q') || '';
  function render() {
    let total = 0;
    for (const item of items) {
      const match = matchesNote(item.dataset.search, input.value);
      if (match) total++;
      item.hidden = !match || total > limit;
    }
    for (const year of years) year.hidden = ![...year.querySelectorAll('[data-note]')].some(item => !item.hidden);
    const shown = Math.min(limit, total);
    count.textContent = chinese ? `共 ${total} 篇，已显示 ${shown} 篇` : `${total} notes · ${shown} shown`;
    if (empty) empty.hidden = total !== 0;
    if (more) more.hidden = total <= limit;
  }
  function search() {
    limit = 30;
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    render();
  }
  input.addEventListener('input', event => {
    if (event.isComposing) return;
    clearTimeout(timer); timer = setTimeout(search, 120);
  });
  input.addEventListener('compositionend', search);
  root.querySelector('[data-clear]').addEventListener('click', () => { clearTimeout(timer); input.value = ''; search(); input.focus(); });
  more?.addEventListener('click', () => {
    const next = items.find(item => item.hidden && matchesNote(item.dataset.search, input.value));
    limit += 30; render(); next?.querySelector('a')?.focus();
  });
  root.querySelector('.notes-tools').hidden = false;
  render();
}
