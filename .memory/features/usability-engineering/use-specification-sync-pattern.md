# Use Specification Sync Pattern

The 'Use Specification' tab in the Usability Engineering (UEF) module is a read-only view that synchronizes directly with the 'products' table to ensure a single source of truth for device definition data. It displays clinical purpose, intended users, use environments, patient populations, and operating principles. Each section includes an 'Edit in Device Definition' button that navigates the user to the corresponding sub-tab in the Device Information module with a 'returnTo=usability-engineering' parameter, allowing for a seamless edit-and-return workflow via the FloatingReturnButton.

## Navigation Flow
1. User views Use Specification in UEF (read-only)
2. Clicks "Edit in Device Definition" button for any section
3. Navigates to Device Definition with `returnTo=usability-engineering`
4. `FloatingReturnButton` appears (simple return button, bottom-right)
5. User edits and clicks return button to go back to UEF
6. Data automatically reflects updates on return

## FloatingReturnButton Extension
The `FloatingReturnButton` component was extended to support non-step-based flows like `usability-engineering`. When `returnTo=usability-engineering` is detected, it shows a simple return button (bottom-right) instead of the step navigation bar used for Genesis/Venture Blueprint flows.
