# CSRankings Enhance

Chrome extension to add quick author listing functions to `csrankings.org`.

Installation (for development):

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `csrankings-enhance` directory.

Usage:
- Visit `https://csrankings.org`.
- The extension adds three buttons in the top-right: `authors (raw)`, `authors (adj)`, `reset`.
- Click `authors (raw)` to show authors (name, affiliation, country, raw count) for the currently selected areas/year/region.
- Click `authors (adj)` to show adjusted counts.
- Click `reset` to hide the panel and restore the normal page rendering.

Notes:
- This content script relies on the page exposing `window.csr` / `csr` object used by CSRankings.
