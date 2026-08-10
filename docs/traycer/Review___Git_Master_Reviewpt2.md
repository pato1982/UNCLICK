I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: Material Symbols font was narrowed to a fixed instance, disabling bold and filled icon variants used across the UI.

In `index.html`, review the Material Symbols stylesheet URL change. If the previous bolder/filled icon rendering is intended to be preserved, restore the needed font axes (e.g., request multiple weights and the FILL axis) in the Google Fonts URL, or add a `font-variation-settings` rule for `.material-symbols-outlined` in `src/index.css` to set the desired weight/fill. Otherwise, document that the flat 400-weight look is intentional and consider removing now-ineffective `font-bold`/`font-black` classes from `material-symbols-outlined` spans to avoid confusion.

### Relevant Files
- c:\Users\pc\Documents\GitHub\UNCLICK\index.html
- c:\Users\pc\Documents\GitHub\UNCLICK\src\index.css
---