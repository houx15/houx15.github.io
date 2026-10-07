# Website verification

## Design criteria

The user requested an independent, simple personal website, with projects and technical reports as the main content. No copied theme, branding, prose, or page implementation; no decorative background, animated effects, generic promotional language, or fabricated work. The styling is original; existing websites were consulted only to clarify reading and navigation preferences.

## Local checks — 2026-10-07

- Home, Projects, Reports, and About navigated in a browser; active navigation matches the page.
- Desktop homepage and report inspected at the browser's normal viewport; mobile homepage and report inspected at 390 × 844.
- Report fixture: bilingual paragraphs, inline/display equations, highlighted Python, table, screenshot with caption, footnote, and working heading links.
- Mobile report: page width equals viewport width, image loads and fits the content width, code scrolls within its container, fonts load, no browser warnings or errors.
- Automated integration checks build an empty site and temporary product/report fixtures, verify discoverability, draft and attachment exclusion, preview isolation, stale output removal, title escaping, Chinese heading links, metadata validation, and broken-link rejection.
- Test material is local/temporary and must be removed from `content/` before committing the initial site.

Final result: passed for the local site and report template. Remote deployment is verified separately by its GitHub Actions run and the live website.
