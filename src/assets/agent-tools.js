export const normalize = text => String(text).normalize('NFKC').toLowerCase();
export function tokenize(text) {
  const words = normalize(text).match(/[\p{Script=Han}]+|[\p{L}\p{N}_]+(?:[.+#-][\p{L}\p{N}_]+)*/gu) || [];
  return words.flatMap(word => /\p{Script=Han}/u.test(word) && word.length > 1
    ? Array.from({length: word.length - 1}, (_, i) => word.slice(i, i + 2)) : [word]);
}
// Prefer a compact passage covering distinct query terms over the first incidental match.
function relevantExcerpt(text, terms) {
  const normalized=normalize(text),hits=[];
  for(const term of terms) {
    let at=normalized.indexOf(term);
    while(at>=0){hits.push({at,term});at=normalized.indexOf(term,at+term.length);}
  }
  if(!hits.length)return text.slice(0,320);
  hits.sort((a,b)=>a.at-b.at);
  const counts=new Map();let left=0,best=0,bestCoverage=0,bestSpan=Infinity;
  for(let right=0;right<hits.length;right++) {
    const hit=hits[right];counts.set(hit.term,(counts.get(hit.term)||0)+1);
    while(hit.at-hits[left].at>240){const term=hits[left++].term;counts.set(term,counts.get(term)-1);if(!counts.get(term))counts.delete(term);}
    const span=hit.at-hits[left].at;
    if(counts.size>bestCoverage || (counts.size===bestCoverage && span<bestSpan)) {
      bestCoverage=counts.size;bestSpan=span;best=hits[left].at;
    }
  }
  const start=Math.max(0,best-40);
  return text.slice(start,start+320);
}
const bounded = (value, fallback, max) => Number.isInteger(value) ? Math.max(0, Math.min(max, value)) : fallback;
const safeURL = url => typeof url === 'string' && /^\/(?:zh\/)?(?:projects|reports|notes)\/[a-z0-9-]+\/(?:#[^\s]*)?$/.test(url);

export function createContentTools(corpus) {
  if (corpus.schemaVersion !== 1 || !Array.isArray(corpus.documents)) throw new Error('Invalid corpus');
  const docs = new Map(), sections = new Map(), postings = new Map();
  let totalLength = 0;
  for (const doc of corpus.documents) {
    if (!safeURL(doc.url)) throw new Error('Invalid source URL');
    docs.set(doc.id, doc);
    for (const section of doc.sections) {
      if (!safeURL(section.url)) throw new Error('Invalid section URL');
      const frequencies = new Map();
      for (const [text, weight] of [[doc.title, 4], [doc.tags.join(' '), 3], [section.heading, 2], [doc.summary, 1.5], [section.text, 1]]) {
        for (const term of tokenize(text)) frequencies.set(term, (frequencies.get(term) || 0) + weight);
      }
      const length = tokenize(section.text).length || 1;
      totalLength += length;
      sections.set(section.id, { doc, section, length });
      for (const [term, frequency] of frequencies) {
        if (!postings.has(term)) postings.set(term, new Map());
        postings.get(term).set(section.id, frequency);
      }
    }
  }
  const averageLength = totalLength / (sections.size || 1);
  const card = doc => ({ id: doc.id, title: doc.title, summary: doc.summary, url: doc.url, date: doc.date, type: doc.type });
  const requireDoc = id => { const doc = docs.get(id); if (!doc) throw new Error('Unknown document'); return doc; };
  function search_content({ query, documentId, type, from, to, language, offset = 0, limit = 5 } = {}) {
    if (typeof query !== 'string' || query.length > 400) throw new Error('Invalid query');
    if(documentId !== undefined) requireDoc(documentId);
    const terms = [...new Set(tokenize(query))];
    if (!terms.length) return { total: 0, results: [] };
    const phrases = [...normalize(query).matchAll(/"([^"]+)"/g)].map(match => match[1]);
    const scores = new Map();
    for (const term of terms) {
      const posting = postings.get(term);
      if (!posting) continue;
      const idf = Math.log(1 + (sections.size - posting.size + 0.5) / (posting.size + 0.5));
      for (const [id, frequency] of posting) {
        const { length } = sections.get(id);
        const score = idf * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * length / averageLength));
        scores.set(id, (scores.get(id) || 0) + score);
      }
    }
    const grouped = new Map();
    for (const [id, score] of scores) {
      const { doc, section } = sections.get(id);
      if (documentId !== undefined && doc.id !== documentId) continue;
      if ((type && doc.type !== type) || (from && doc.date < from) || (to && doc.date > to)) continue;
      const haystack = normalize(`${doc.title}\n${section.heading}\n${section.text}`);
      if (phrases.some(phrase => !haystack.includes(phrase))) continue;
      // Site-wide results represent documents; a scoped query returns matching passages.
      const resultKey = documentId === undefined ? doc.canonicalId : section.id;
      const old = grouped.get(resultKey);
      const result = { ...card(doc), sectionId: id, heading: section.heading, sourceUrl: section.url, score,
        excerpt: relevantExcerpt(section.text,terms), language: doc.language };
      // Select the best section; prefer the requested language only at comparable relevance.
      const adjusted = score * (doc.language === language ? 1.1 : 1);
      if (!old || adjusted > old.adjusted) grouped.set(resultKey, { ...result, adjusted });
    }
    const results = [...grouped.values()].sort((a, b) => b.adjusted - a.adjusted || a.id.localeCompare(b.id) || a.sectionId.localeCompare(b.sectionId));
    offset = bounded(offset, 0, 10000); limit = bounded(limit, 5, 10);
    return { total: results.length, results: results.slice(offset, offset + limit).map(({ adjusted, ...result }) => result) };
  }
  function read_content({ id, sectionId, offset = 0 } = {}) {
    const doc = requireDoc(id);
    if (sectionId && !doc.sections.some(section => section.id === sectionId)) throw new Error('Unknown section');
    offset = bounded(offset, 0, doc.sections.length);
    const selected = sectionId ? doc.sections.filter(section => section.id === sectionId) : doc.sections.slice(offset, offset + 3);
    return { ...card(doc), sections: selected, nextOffset: !sectionId && offset + 3 < doc.sections.length ? offset + 3 : null };
  }
  function show_post_cards({ ids, language } = {}) {
    if (!Array.isArray(ids) || ids.length > 3) throw new Error('At most three cards');
    const seen = new Set();
    const localized=doc=>language?[...docs.values()].find(other=>other.canonicalId===doc.canonicalId && other.language===language) || doc:doc;
    return { type: 'post_cards', items: ids.map(requireDoc).filter(doc => !seen.has(doc.canonicalId) && seen.add(doc.canonicalId)).map(localized).map(card) };
  }
  function query_timeline({ from, to, language } = {}) {
    const seen = new Set();
    const sorted = [...docs.values()].sort((a, b) => b.date.localeCompare(a.date) || Number(b.language === language) - Number(a.language === language));
    const items = sorted.filter(doc => (!from || doc.date >= from) && (!to || doc.date <= to))
      .filter(doc => !seen.has(doc.canonicalId) && seen.add(doc.canonicalId));
    return { type: 'publication_timeline', dateKind: 'publication', total: items.length, items: items.slice(0, 12).map(card) };
  }
  function find_related_posts({ id, query, language, excludeIds = [] } = {}) {
    const doc = id ? requireDoc(id) : null;
    const excluded = new Set([...excludeIds, ...(doc ? [doc.id] : [])].filter(key => docs.has(key)).map(key => docs.get(key).canonicalId));
    const result = search_content({ query: (query || `${doc?.title || ''} ${doc?.tags.join(' ') || ''}`).slice(0, 400), language, limit: 10 });
    return result.results.filter(item => !excluded.has(docs.get(item.id).canonicalId)).slice(0, 3);
  }
  function suggest_questions({ id, language, question } = {}) {
    if(question!==undefined) {
      const doc=requireDoc(id);
      if(typeof question!=='string' || !question.trim() || question.length>200)throw new Error('Invalid follow-up question');
      return {type:'questions',items:[{documentId:doc.id,label:question.trim(),query:question.trim()}]};
    }
    const zh = language === 'zh-CN';
    const selected = id ? [requireDoc(id)] : query_timeline({ language }).items.slice(0, 3).map(item => docs.get(item.id));
    return { type: 'questions', items: selected.map(doc => ({ documentId: doc.id,
      label: zh ? `阅读：${doc.title}` : `Read: ${doc.title}`, query: doc.title.slice(0, 400) })) };
  }
  function show_visualization({ kind, ids } = {}) {
    if (kind !== 'publication_timeline' || !Array.isArray(ids) || ids.length > 12) throw new Error('Unsupported visualization');
    const seen = new Set();
    return { type: kind, dateKind: 'publication', items: ids.map(requireDoc).filter(doc => !seen.has(doc.canonicalId) && seen.add(doc.canonicalId))
      .sort((a, b) => a.date.localeCompare(b.date)).map(card) };
  }
  function show_reading_map({ id, sectionIds } = {}) {
    const doc=requireDoc(id);
    if(!Array.isArray(sectionIds) || !sectionIds.length || sectionIds.length>6 || sectionIds.some(key=>!doc.sections.some(section=>section.id===key)))throw new Error('Invalid reading map');
    const selected=new Set(sectionIds);
    return {type:'reading_map',title:doc.title,documentId:doc.id,url:doc.url,items:doc.sections.filter(section=>selected.has(section.id)).map(section=>({id:section.id,title:section.heading,excerpt:section.text.slice(0,240),url:section.url}))};
  }
  return { search_content, read_content, find_related_posts, query_timeline, show_post_cards, suggest_questions, show_visualization, show_reading_map };
}
