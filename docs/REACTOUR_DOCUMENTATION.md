# Reactour Documentation

> **"The Tourist Guide into your React Components"**

Reactour is a powerful React library for creating interactive user onboarding tours. This documentation covers all features, props, and usage patterns.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Packages](#core-packages)
- [Tour Component Props](#tour-component-props)
- [Hooks & HOC](#hooks--hoc)
- [Mask Component](#mask-component)
- [Popover Component](#popover-component)
- [Examples](#examples)
- [Documentation URLs](#documentation-urls)

---

## Overview

Reactour provides a component-based approach to creating user onboarding experiences. The library is modular and consists of three independent packages:

| Package | Description | NPM |
|---------|-------------|-----|
| **@reactour/tour** | Complete tour functionality | `npm i @reactour/tour` |
| **@reactour/mask** | Visual masking component | `npm i @reactour/mask` |
| **@reactour/popover** | Tooltip/popover display | `npm i @reactour/popover` |

---

## Installation

```bash
# npm
npm i @reactour/tour

# pnpm
pnpm add @reactour/tour

# yarn
yarn add @reactour/tour

# bun
bun add @reactour/tour
```

---

## Quick Start

### Step 1: Add TourProvider

Wrap your application with `TourProvider` and pass an array of steps:

```jsx
import { TourProvider } from '@reactour/tour'

const steps = [
  {
    selector: '.first-step',
    content: 'This is my first Step',
  },
  {
    selector: '.second-step',
    content: 'This is the second Step',
  },
]

ReactDOM.render(
  <TourProvider steps={steps}>
    <App />
  </TourProvider>,
  document.getElementById('root')
)
```

### Step 2: Control the Tour

Use the `useTour` hook to manage tour state:

```jsx
import { useTour } from '@reactour/tour'

function App() {
  const { setIsOpen } = useTour()

  return (
    <>
      <p className="first-step">Your content here</p>
      <p className="second-step">More content</p>
      <button onClick={() => setIsOpen(true)}>Open Tour</button>
    </>
  )
}
```

---

## Core Packages

### Tour Package
The main package that combines Mask and Popover functionality for complete tour experiences.

### Mask Package
Handles the visual overlay/masking effect that highlights specific elements.

### Popover Package
Manages the tooltip/popover content display and positioning.

---

## Tour Component Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `StepType[]` | - | Array of elements to highlight with special info and props |
| `components` | `PopoverComponentsType` | - | Customize granular components inside the Popover |
| `styles` | `StylesObj & PopoverStylesObj & MaskStylesObj` | - | Customize styles for Mask, Popover, and Tour parts |
| `padding` | `Padding` | - | Extra space between Mask, Popover, and highlighted element |
| `position` | `Position` | - | Global position value for the Popover in all steps |
| `setCurrentStep` | `Dispatch<SetStateAction<number>>` | - | Function to control Tour current step state |
| `currentStep` | `number` | - | Custom Tour current step state |

### Interaction Control

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disableInteraction` | `boolean \| function` | - | Disables clicking/interacting with highlighted element |
| `disableFocusLock` | `boolean` | - | Disables FocusScope behavior during Tour |
| `disableDotsNavigation` | `boolean` | - | Disables dot navigation interactivity |
| `disableWhenSelectorFalsy` | `boolean` | - | Hides tours when selector is falsy |
| `disableKeyboardNavigation` | `boolean \| KeyboardParts[]` | `false` | Disables keyboard navigation events |

### Styling & Display

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `reactour__popover` | CSS classname for the Popover |
| `maskClassName` | `string` | `reactour__mask` | CSS classname for the Mask |
| `highlightedMaskClassName` | `string` | `reactour__mask` | CSS classname for highlighted Mask area |
| `showNavigation` | `boolean` | `true` | Show/hide Navigation controls |
| `showPrevNextButtons` | `boolean` | `true` | Show/hide Prev/Next buttons |
| `showCloseButton` | `boolean` | `true` | Show/hide Close button |
| `showBadge` | `boolean` | `true` | Show/hide Badge |
| `showDots` | `boolean` | `true` | Show/hide dots navigation |

### Navigation Customization

| Prop | Type | Description |
|------|------|-------------|
| `nextButton` | `(props: BtnFnProps) => void` | Customize Next button with helper parameters |
| `prevButton` | `(props: BtnFnProps) => void` | Customize Prev button with helper parameters |
| `badgeContent` | `(badgeProps: BadgeProps) => any` | Customize Badge content with step info |

### Event Handlers

| Prop | Type | Description |
|------|------|-------------|
| `afterOpen` | `(target: Element \| null) => void` | Action fired after Tour opens |
| `beforeClose` | `(target: Element \| null) => void` | Action fired before Tour closes |
| `onClickMask` | `(clickProps: ClickProps) => void` | Override default Mask click behavior |
| `onClickClose` | `(clickProps: ClickProps) => void` | Override default Close icon behavior |
| `onClickHighlighted` | `(e: MouseEvent, clickProps: ClickProps) => void` | Click handler for highlighted area |
| `keyboardHandler` | `(e: KeyboardEvent, clickProps?: ClickProps, status?: object) => void` | Custom keyboard event handler |

### Advanced Props

| Prop | Type | Description |
|------|------|-------------|
| `scrollSmooth` | `boolean` | Activate smooth scroll when steps outside viewport |
| `inViewThreshold` | `{ x?: number, y?: number } \| number` | Tolerance in pixels for viewport detection |
| `accessibilityOptions` | `A11yOptions` | Configure aria-labels and screen reader visibility |
| `rtl` | `boolean` | Enable right-to-left navigation mode |
| `maskId` | `string` | Custom ID for the mask SVG element |
| `clipId` | `string` | Custom ID for the clipPath element |
| `onTransition` | `PositionType` | Control Popover behavior during step transitions |
| `ContentComponent` | `ComponentType<PopoverContentProps>` | Custom component for Popover content |
| `Wrapper` | `ComponentType` | Element wrapping the Tour (useful for Portals) |

---

## Hooks & HOC

### useTour Hook

The `useTour` hook enables component-level interaction with the tour system.

```jsx
import { useTour } from '@reactour/tour'

function MyComponent() {
  const {
    isOpen,
    currentStep,
    steps,
    setIsOpen,
    setCurrentStep,
    setSteps,
    meta,
    setMeta
  } = useTour()

  return (
    <>
      <h1>{isOpen ? 'Welcome to the tour!' : 'Tour closed'}</h1>
      <p>Step {currentStep + 1} of {steps.length}</p>
      <button onClick={() => setIsOpen(o => !o)}>Toggle Tour</button>
      <button onClick={() => setCurrentStep(3)}>Jump to Step 4</button>
    </>
  )
}
```

#### Return Values

| Property | Type | Purpose |
|----------|------|---------|
| `isOpen` | `boolean` | Whether the tour is currently active |
| `currentStep` | `number` | Zero-indexed current step position |
| `steps` | `StepType[]` | Array of tour step definitions |
| `setIsOpen` | `Function` | Controls tour visibility state |
| `setCurrentStep` | `Function` | Navigates to a specific step |
| `setSteps` | `Function` | Updates the tour steps array |
| `meta` | `string` | Global metadata for complex scenarios |
| `setMeta` | `Function` | Updates global metadata |

### withTour HOC

For class-based components:

```jsx
import { withTour } from '@reactour/tour'

class MyComponent extends Component {
  render() {
    return (
      <button onClick={() => this.props.setIsOpen(true)}>
        Start Tour
      </button>
    )
  }
}

export default withTour(MyComponent)
```

---

## Mask Component

The Mask component creates the visual overlay effect.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `sizes` | `RectResult` | Object containing size/position info based on `getBoundingClientRect` |
| `className` | `string` | CSS class for the mask wrapper |
| `highlightedAreaClassName` | `string` | CSS class for the highlighted area |
| `padding` | `number \| number[]` | Extra space in Mask calculations |
| `wrapperPadding` | `number \| number[]` | Extra space between viewport width/height |
| `onClick` | `MouseEventHandler<HTMLDivElement>` | Click handler for mask area |
| `onClickHighlighted` | `MouseEventHandler<SVGRectElement>` | Click handler for highlighted area |
| `maskId` | `string` | Custom ID for mask element |
| `clipId` | `string` | Custom ID for clipPath element |
| `styles` | `StylesObj` | Custom styles for mask parts |

### RectResult Structure

```typescript
interface RectResult {
  width: number
  height: number
  top: number
  left: number
  bottom?: number
  right?: number
}
```

### Padding Syntax

Follows CSS shorthand:
- Single value: `10`
- Two values: `[10, 20]` (vertical, horizontal)
- Three values: `[10, 20, 30]` (top, horizontal, bottom)
- Four values: `[10, 20, 30, 40]` (top, right, bottom, left)

---

## Popover Component

The Popover component handles tooltip content display.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `sizes` | `RectResult` | Object with dimensions and position info |
| `position` | `Position` | Placement: `'top' \| 'right' \| 'bottom' \| 'left' \| 'center' \| [number, number] \| function` |
| `padding` | `number \| number[]` | Extra spacing for calculations |
| `className` | `string` | CSS classname for the Popover |
| `refresher` | `any` | Triggers rect recalculation when changed |
| `styles` | `StylesObj` | Customization function for styling |

### Dynamic Position Function

```typescript
type PositionFunction = (
  positionProps: PositionProps,
  prevRect: RectResult
) => Position
```

---

## Examples

### 1. Basic Example

```jsx
import { TourProvider, useTour } from '@reactour/tour'

const steps = [
  { selector: '.step-1', content: 'Welcome!' },
  { selector: '.step-2', content: 'This is step 2' },
]

function App() {
  const { setIsOpen } = useTour()
  return (
    <div>
      <div className="step-1">First element</div>
      <div className="step-2">Second element</div>
      <button onClick={() => setIsOpen(true)}>Start Tour</button>
    </div>
  )
}

export default function Root() {
  return (
    <TourProvider steps={steps}>
      <App />
    </TourProvider>
  )
}
```

### 2. Mask Click Navigation

```jsx
<TourProvider
  steps={steps}
  onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
    if (currentStep === steps.length - 1) {
      setIsOpen(false)
    } else {
      setCurrentStep(s => s + 1)
    }
  }}
>
  <App />
</TourProvider>
```

### 3. Custom Prev/Next Buttons

```jsx
<TourProvider
  steps={steps}
  prevButton={({ currentStep, setCurrentStep, steps }) => {
    const first = currentStep === 0
    return (
      <button
        onClick={() => {
          if (first) {
            setCurrentStep(steps.length - 1)
          } else {
            setCurrentStep(s => s - 1)
          }
        }}
      >
        {first ? 'Last' : 'Back'}
      </button>
    )
  }}
  nextButton={({ currentStep, setCurrentStep, steps, setIsOpen }) => {
    const last = currentStep === steps.length - 1
    return (
      <button
        onClick={() => {
          if (last) {
            setIsOpen(false)
          } else {
            setCurrentStep(s => s + 1)
          }
        }}
      >
        {last ? 'Close' : 'Next'}
      </button>
    )
  }}
>
  <App />
</TourProvider>
```

### 4. Disable Keyboard Navigation

```jsx
<TourProvider
  steps={steps}
  disableKeyboardNavigation={['esc', 'left']} // or true for all
>
  <App />
</TourProvider>
```

### 5. Custom Styles

```jsx
<TourProvider
  steps={steps}
  styles={{
    popover: (base) => ({
      ...base,
      backgroundColor: '#333',
      color: '#fff',
      borderRadius: '8px',
    }),
    maskArea: (base) => ({
      ...base,
      rx: 8,
    }),
    badge: (base) => ({
      ...base,
      backgroundColor: '#0d9488',
    }),
  }}
>
  <App />
</TourProvider>
```

### 6. Smooth Scrolling

```jsx
<TourProvider
  steps={steps}
  scrollSmooth
  inViewThreshold={{ x: 20, y: 20 }}
>
  <App />
</TourProvider>
```

### 7. Disable Scroll During Tour

```jsx
<TourProvider
  steps={steps}
  afterOpen={() => {
    document.body.style.overflow = 'hidden'
  }}
  beforeClose={() => {
    document.body.style.overflow = 'auto'
  }}
>
  <App />
</TourProvider>
```

### 8. Custom Badge Content

```jsx
<TourProvider
  steps={steps}
  badgeContent={({ totalSteps, currentStep }) => (
    `${currentStep + 1}/${totalSteps}`
  )}
>
  <App />
</TourProvider>
```

### 9. Start at Specific Step

```jsx
<TourProvider
  steps={steps}
  startAt={2} // Zero-indexed, starts at step 3
>
  <App />
</TourProvider>
```

### 10. RTL Support

```jsx
<TourProvider
  steps={steps}
  rtl
>
  <App />
</TourProvider>
```

### 11. Toggle Navigation Parts

```jsx
<TourProvider
  steps={steps}
  showBadge={false}
  showCloseButton={true}
  showNavigation={true}
  showPrevNextButtons={true}
  showDots={false}
>
  <App />
</TourProvider>
```

### 12. Disable Interaction with Highlighted Element

```jsx
<TourProvider
  steps={steps}
  disableInteraction
>
  <App />
</TourProvider>
```

---

## Documentation URLs

| Page | URL |
|------|-----|
| Home | https://docs.reactour.dev/ |
| Quick Start | https://docs.reactour.dev/quickstart |
| Examples | https://docs.reactour.dev/examples |
| **Tour Package** | |
| Tour Quick Start | https://docs.reactour.dev/tour/quickstart |
| Tour Props | https://docs.reactour.dev/tour/props |
| Tour Hooks | https://docs.reactour.dev/tour/hooks |
| Tour Examples | https://docs.reactour.dev/tour/examples |
| **Mask Package** | |
| Mask Quick Start | https://docs.reactour.dev/mask/quickstart |
| Mask Props | https://docs.reactour.dev/mask/props |
| **Popover Package** | |
| Popover Quick Start | https://docs.reactour.dev/popover/quickstart |
| Popover Props | https://docs.reactour.dev/popover/props |

---

## Additional Resources

- **GitHub Repository:** https://github.com/elrumordelaluz/reactour
- **npm Package:** https://www.npmjs.com/package/@reactour/tour

---

## Migration from driver.js

If migrating from driver.js to Reactour:

| driver.js | Reactour |
|-----------|----------|
| `driver()` | `<TourProvider>` |
| `steps` array | `steps` prop |
| `element` | `selector` |
| `popover.title` | Use `content` with custom component |
| `popover.description` | Use `content` |
| `onNextClick` | `nextButton` prop |
| `onPrevClick` | `prevButton` prop |
| `onDestroyed` | `beforeClose` |
| `drive()` | `setIsOpen(true)` |
| `destroy()` | `setIsOpen(false)` |

---

*Last updated: December 2024*
*Based on Reactour documentation at https://docs.reactour.dev/*
