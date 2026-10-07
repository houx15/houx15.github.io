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

## Initial production deployment

- Rebuild branch CI: run `37682601708`, successful.
- Main merge: `bf2865a16ea91b2f378d6eb8181ab7847540776a`.
- Pages run `37682691754`, attempt 2: build and deploy successful. The initial attempt exposed a legacy environment restriction to `master`; it was changed to `main` without removing the restriction.
- The live home, Projects, Reports, and About pages were opened and their navigation verified. No browser warnings or errors were observed.
- The current site is intentionally empty. No fixture or former blog content was published.

## Publishing workflow

- Ten local automated tests passed, including report/article and project/product commands, update-date preservation, immutable slugs, duplicate/path rejection, failed-publication rollback, skill installation/update behavior, and repeated draft-preview edits.
- Both the repository skill and its installed copy passed the skill creator's validator; their files match.
- Live deployments expose `build-info.json` so the publishing workflow can verify the exact deployed commit rather than infer success from a push.

The preview regression test exposed output-directory caching during watch mode. Production builds still clean their output completely; preview rebuilds preserve directories and remove stale content files. The regression test edits a draft twice and verifies removal of an entry on the next rebuild, with no missing-directory errors.
