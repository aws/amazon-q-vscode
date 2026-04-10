## 2025-05-14 - [Accessible Icon-Only Radio Buttons]
**Learning:** In this codebase, radio buttons (e.g., in `submitFeedback.vue`) often use empty `<label>` elements for CSS-based icon styling. This makes them invisible to screen readers as they lack an accessible name.
**Action:** Always check if `<label>` elements associated with `<input>` fields are empty or only contain icons. If so, add a descriptive `aria-label` directly to the `<input>` element to ensure screen reader compatibility.
