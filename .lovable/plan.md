# Fix: Rendered more hooks than during the previous render

## Problem
`ChangeControlDetailPage.tsx` crashes with *"Rendered more hooks than during the previous render"* whenever you open a CCR. Cause: the two new `useState` calls added for the Resend feature sit **after** the early return `if (!ccr) return <NotFound/>` (line 486):

```
~ line 486:  if (!ccr) { return (...); }
...
~ line 821:  const [resendingForId, setResendingForId] = useState<string | null>(null);
~ line 822:  const [lastResendAt, setLastResendAt] = useState<number>(0);
```

First render (ccr still loading) skips those hooks; second render (ccr loaded) runs them → React aborts.

## Fix
Move both `useState` declarations above the early return, next to the other top-level state hooks in the component. No behaviour change — purely relocating two lines so hook order is stable.

## Files
- `src/pages/ChangeControlDetailPage.tsx` — relocate `resendingForId` / `lastResendAt` `useState` hooks (and the `resendThrottleMs` const) above the `if (!ccr)` early return.

## Out of scope
No changes to the resend logic, UI, notifications, audit-log insert, or any other file.
