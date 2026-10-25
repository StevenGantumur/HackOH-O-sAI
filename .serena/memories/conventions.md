# Conventions
- Use hash links and helpers from `src/shared/router.js`; task details open through the query-backed task drawer.
- Treat a task with `estimated_minutes != null` as a mission; do not duplicate missions into a separate model.
- Recommendation order is deterministic rules-based matching in `src/discovery/score.js`; UI must describe it as rules-based and must not claim AI ranking.
- Reuse presentation metadata from `src/shared/labels.js` and selectors from `src/shared/selectors.js`.
- Icons are local 24px line drawings in `src/shared/ui/Icon.jsx`; avoid adding an icon dependency.
- CSS design tokens and shared primitives live in `src/shared/ui/ui.css`; module styles live beside their module or in the app shell stylesheet.
- Sample project records and fictional people must remain clearly identified as sample data.