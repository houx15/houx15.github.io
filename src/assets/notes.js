export function matchesNote(text, query) {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const haystack = normalize(text);
  return normalize(query).split(' ').filter(Boolean).every(term => haystack.includes(term));
}

export function initNotes(root, win = globalThis) {
  if (!root) return;
  const items = [...root.querySelectorAll('[data-note]')];
  const years = [...root.querySelectorAll('[data-year]')];
  const input = root.querySelector('input');
  const more = root.querySelector('[data-more]');
  const empty = root.querySelector('[data-no-results]');
  const count = root.querySelector('[data-count]');
  const chinese = root.dataset.locale === 'zh-CN';
  const typeLinks=[...root.querySelectorAll('[data-writing-type]')].filter(link=>link.dataset.writingType!==undefined);
  const tagLinks=[...root.querySelectorAll('[data-writing-tag]')].filter(link=>link.dataset.writingTag!==undefined);
  let type='',tag='';
  let limit = 30;
  let timer;
  function restore() {
    clearTimeout(timer);
    const params=new URL(win.location.href).searchParams;
    input.value=params.get('q')||'';
    type=typeLinks.some(link=>link.dataset.writingType===params.get('type'))?params.get('type'):'';
    tag=tagLinks.some(link=>link.dataset.writingTag===params.get('tag'))?params.get('tag'):'';
    limit=30;render();
  }
  const matches=item=>matchesNote(item.dataset.search,input.value) && (!type||item.dataset.writingEntryType===type) && (!tag||(item.dataset.entryTags||'').split('|').includes(tag));
  function render() {
    let total = 0;
    for (const item of items) {
      const match = matches(item);
      if (match) total++;
      item.hidden = !match || total > limit;
    }
    for (const year of years) year.hidden = ![...year.querySelectorAll('[data-note]')].some(item => !item.hidden);
    const shown = Math.min(limit, total);
    count.textContent = chinese ? `共 ${total} 篇，已显示 ${shown} 篇` : `${total} articles · ${shown} shown`;
    if (empty) empty.hidden = total !== 0;
    if (more) more.hidden = total <= limit;
    for(const link of [...typeLinks,...tagLinks]) {
      const current=link.dataset.writingType!==undefined?link.dataset.writingType===type:link.dataset.writingTag===tag;
      if(current)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    }
  }
  function search() {
    limit = 30;
    const url = new URL(win.location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
    win.history.replaceState(null, '', url);
    render();
  }
  input.addEventListener('input', event => {
    if (event.isComposing) return;
    clearTimeout(timer); timer = setTimeout(search, 120);
  });
  input.addEventListener('compositionend', search);
  root.querySelector('[data-clear]').addEventListener('click', () => { clearTimeout(timer); input.value = ''; search(); input.focus(); });
  more?.addEventListener('click', () => {
    const next = items.find(item => item.hidden && matches(item));
    limit += 30; render(); next?.querySelector('a')?.focus();
  });
  for(const link of [...typeLinks,...tagLinks])link.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
    event.preventDefault();clearTimeout(timer);
    const url=new URL(win.location.href);
    const field=link.dataset.writingType!==undefined?'type':'tag';
    const value=field==='type'?link.dataset.writingType:link.dataset.writingTag;
    if(value)url.searchParams.set(field,value);else url.searchParams.delete(field);
    if(input.value.trim())url.searchParams.set('q',input.value.trim());else url.searchParams.delete('q');
    win.history.pushState(null,'',url);restore();
  });
  win.addEventListener?.('popstate',restore);
  win.addEventListener?.('pageshow',restore);
  root.querySelector('.notes-tools').hidden = false;
  restore();
}
