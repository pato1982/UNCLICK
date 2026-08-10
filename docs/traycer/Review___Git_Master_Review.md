I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: Service worker globPatterns and includeAssets omit webp, so the new hero LCP images aren't precached.

In `vite.config.js`, update the `VitePWA` configuration: add `webp` to the `workbox.globPatterns` extension list (e.g., include `webp` alongside `png`, `svg`, etc.) so files under `public/hero/` are added to the precache manifest. Optionally extend `includeAssets` to cover the hero WebP assets for consistency with the `index.html` preload.

### Relevant Files
- c:\Users\pc\Documents\GitHub\UNCLICK\vite.config.js
- c:\Users\pc\Documents\GitHub\UNCLICK\index.html
---