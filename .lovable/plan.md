## Problem

Two issues are blocking the Edit-to-side-drawer flow:

1. **Vite build error** — `src/components/gantt-chart/src/index.js` imports from `@svar-ui/gantt-store` and `@svar-ui/react-editor`, but only `@svar-ui/react-gantt` is installed. This breaks the whole app preview, which is why the Edit button appears not to work.
2. **Edit button on templates list** opens a small modal for non-SOP templates instead of the side drawer (DocumentDraftDrawer). SOPs already route to the drawer; non-SOP templates do not.

## Changes

### 1. Fix Gantt import (`src/components/gantt-chart/src/index.js`)

`@svar-ui/react-gantt` re-exports everything from `@svar-ui/gantt-store` plus `registerEditorItem` from `@svar-ui/react-editor`. Replace the two broken imports with a single import from the installed package:

```js
export {
  defaultEditorItems,
  defaultToolbarButtons,
  defaultMenuOptions,
  defaultColumns,
  defaultTaskTypes,
  registerScaleUnit,
  registerEditorItem,
} from '@svar-ui/react-gantt';
```

### 2. Route Edit button to side drawer for all templates (`src/components/settings/document-control/templates/TemplateManagementTab.tsx`)

Update `handleEdit` so non-SOP templates also open in the `DocumentDraftDrawer`. Add a small helper that looks up the existing studio draft by name and opens the drawer; if no draft exists, fall back to the current metadata edit modal.

```tsx
const handleEdit = (template: any) => {
  setSelectedTemplate(template);
  if (isSOP(template.name)) {
    void openSopEditor(template);
  } else {
    void openNonSopEditor(template);
  }
};

const openNonSopEditor = async (template: any) => {
  try {
    const { data, error } = await supabase
      .from('document_studio_templates')
      .select('id, name, type')
      .eq('company_id', companyId)
      .eq('name', template.name)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setDraftDrawerDoc({
        id: data.id,
        name: data.name,
        type: (data as any).type || template.document_type || 'Template',
      });
    } else {
      setEditDialogOpen(true); // fallback: no draft yet
    }
  } catch (e) {
    console.error('Error opening template draft drawer:', e);
    setEditDialogOpen(true);
  }
};
```

No other files change. The existing `DocumentDraftDrawer` mount at the bottom of the component is reused.

## Result

- The Vite import error is gone; the preview loads again.
- Clicking the Edit (pencil) icon on any template row in `Documents → Enterprise Templates` opens the side drawer:
  - SOPs: existing seeding-then-drawer flow (unchanged).
  - Non-SOP templates with a studio draft: drawer opens directly on that draft.
  - Non-SOP templates without a draft: metadata edit modal opens (current behavior, fallback only).
