I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: Non-first hero slides are lazy and low fetch priority, risking a blank flash on the first auto-rotation.

In `src/components/HeroBanner.jsx`, adjust the slide `<img>` loading strategy so the non-first slides are available before the auto-rotation fires. Either drop `loading="lazy"`/`fetchpriority="low"` for slides 2 and 3 (letting them load normally after the eager first slide), or trigger a deferred prefetch of the remaining hero WebP sources after first paint. Preserve the first slide's `eager`/`high` priority for LCP.

### Relevant Files
- c:\Users\pc\Documents\GitHub\UNCLICK\src\components\HeroBanner.jsx
---