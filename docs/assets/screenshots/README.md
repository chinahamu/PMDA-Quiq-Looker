# Screenshot Assets

This directory contains release-documentation screenshot placeholders and capture guidance for Chrome Web Store submission.

Before public submission, replace the placeholder SVG files with real screenshots captured from the current release build.

## Required screenshots

| File | Purpose | Recommended final format |
| --- | --- | --- |
| `load-unpacked.svg` | Development/user guide installation step | PNG for store, SVG allowed for docs |
| `context-menu-search.svg` | Context menu lookup flow | PNG for store, SVG allowed for docs |
| `popup-search.svg` | Popup candidate list | PNG for store, SVG allowed for docs |

## Capture checklist

1. Run `npm run build`.
2. Load `dist/` as an unpacked extension.
3. Use public sample drug names only, such as `アムロジピン`.
4. Do not capture patient information, institution-specific identifiers, internal URLs, or electronic medical record data.
5. Crop browser chrome if needed, but keep enough context to understand the UI.
6. Save final store screenshots outside the extension package unless they are intentionally published in docs.
