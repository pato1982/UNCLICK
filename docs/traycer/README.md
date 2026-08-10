I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: New empty-sections placeholder shows a permanent spinner when the listings API fails or returns no items.

In `src/App.jsx`, add an explicit load-state for the listings request (for example a `listingsLoaded` boolean, defaulting to false). Set it to true inside both the success `.then` and the `.catch` of the `fetch(${API}/api/v1/public/listings)` effect. In the render branch that currently does `if (sections.length === 0) { return <HeroBanner/> + <CategoryGrid/> + spinner }`, gate the spinner on the loading state instead of solely on `sections.length === 0`, so that once loading has completed (success with empty data or error) the code falls through to the normal layout or renders an empty/error state rather than a perpetual spinner.

### Relevant Files
- c:\Users\pc\Documents\GitHub\UNCLICK\src\App.jsx
---