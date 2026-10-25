# Bridge Builder core
- React single page app rooted at `src/app/App.jsx`; hash routes preserve static-host compatibility.
- Workspace/project domain data is seeded in `seed/seed.js` and persisted through `src/shared/mockDb.js`; authenticated accounts, account profiles, and direct messages use Supabase.
- All shared data reads go through `src/shared/selectors.js`; UI mutations go through the store/mock DB contract.
- Read `mem:tech_stack` for runtime/build dependencies.
- Read `mem:conventions` for code and product invariants.
- Read `mem:suggested_commands` for supported local commands.
- Read `mem:task_completion` for the completion gate.