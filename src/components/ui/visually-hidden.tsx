import * as React from "react"

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Inlined to avoid an external dependency.
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ style, ...props }, ref) => (
  <span
    ref={ref}
    {...props}
    style={{
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      borderWidth: 0,
      ...style,
    }}
  />
))
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
