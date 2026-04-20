

## Why the change isn't visible

The user is on `/app/company/Nox Medical/documents?tab=templates`.
That route renders `CompanyDocumentsPage` → `<TemplatesSettings />` (the "Template Library" UI in the screenshot).

The `SopAutoSeedStatus` banner I added is mounted inside `DocumentControl` (`src/components/settings/DocumentControl.tsx`), which is only reached via:
- `CompanySettings` page → `tab=documents` → `DocumentControlSettings` → `AdvancedDocumentManager`, or
- `PhaseDocumentsTab` → `DocumentControlTabs`

Neither path is open on the current screen, so the banner is rendered but not visible. The feature works — it's just on the wrong page.

## Fix

Mount `SopAutoSeedStatus` directly inside `TemplatesSettings.tsx` so it shows up on the page the user is actually using to manage templates (the screenshotted "Template Library").

### Single change
**`src/components/settings/TemplatesSettings.tsx`**
- Import `SopAutoSeedStatus` and `useCompany` (or read `companyName` from the existing context/props the file already uses).
- Render `<SopAutoSeedStatus companyId={companyId} companyName={companyName} />` at the top of the returned JSX, above the existing "Template Library" card.
- No props/API changes elsewhere.

If `TemplatesSettings` doesn't already have `companyName` in scope, derive it from the URL via `useParams()` (the route is `/app/company/:companyName/...`) and `decodeURIComponent` it — same pattern used in `PhaseDocumentsTab.tsx`.

## Out of scope
- No removal from `DocumentControl` — it can stay there too; admins reaching that page still see it.
- No DB / service changes — the seeding logic is untouched.

## Expected outcome
- On `/app/company/.../documents?tab=templates`, the user immediately sees the "Foundation SOPs auto-created — N / 27" strip with the **Seed missing Tier A SOPs** button and the expandable "View Tier A breakdown" list with reasons, exactly as designed.

