# Frontend Components

Shared React components live in `frontend/src/components`. Import them from
their direct source path:

```tsx
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
```

The components use the design tokens and utilities defined in
`frontend/src/style.css`. Prefer `className` for small, page-specific layout
adjustments instead of changing a shared component for one screen.

## Button

`Button` forwards normal button attributes and refs. Its `variant` is one of
`primary`, `secondary`, `ghost`, or `danger`; it defaults to `primary`.

```tsx
<Button type="button" onClick={saveChanges}>
  Save changes
</Button>

<Button type="button" variant="ghost" disabled={isSaving}>
  Cancel
</Button>
```

Use `type="submit"` inside forms and pass `aria-label` when a button contains
only an icon.

## Card

`Card` is a titled surface. `title` is required, while `tag` is optional.
Children provide the card body. It also accepts normal `div` attributes and a
`className` override.

```tsx
<Card tag="Account" title="Profile settings">
  <p>Update your public profile information.</p>
</Card>
```

## Input

`Input` forwards normal input attributes and refs. `label` is required;
`error` changes the visual state and connects the message through
`aria-describedby`; `icon` renders inside the left side of the field.

```tsx
<Input
  label="Email address"
  type="email"
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  placeholder="you@example.com"
  required
/>

<Input label="Username" error={usernameError} {...usernameField} />
```

For controlled fields, provide both `value` and `onChange`. For simple
uncontrolled fields, use `defaultValue` instead.

## Loader

`Loader` displays the shared spinner. Pass `label` when the loading state
needs visible context; omit it when surrounding content already explains the
state.

```tsx
<Loader label="Loading messages..." />
```

It accepts normal `div` attributes and `className` for sizing or placement.

## Modal

`Modal` is controlled by the parent. It renders only when `isOpen` is true,
locks body scrolling while open, and closes when the backdrop or close button
is clicked. `footerActions` is optional and accepts any React content.

```tsx
const [isOpen, setIsOpen] = useState(false);

<Button type="button" onClick={() => setIsOpen(true)}>
  Open details
</Button>

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Match details"
  footerActions={
    <Button type="button" onClick={() => setIsOpen(false)}>
      Done
    </Button>
  }
>
  <p>The modal body can contain any React content.</p>
</Modal>
```

Keep the modal mounted near the page root so its fixed overlay is not clipped
by a parent with `overflow` or a local stacking context.

## ProtectedRoute

`ProtectedRoute` is the route guard for authenticated pages. It renders its
child element when a token exists and redirects to `/login` otherwise.

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

It must be rendered below `AuthProvider` because it reads the auth context.

## Class names with `cn`

Use `cn` when a component combines default classes with conditional or caller
provided classes. `clsx` handles conditional values and `tailwind-merge`
removes conflicting Tailwind utilities.

```tsx
import { cn } from '../utils/cn';

<div className={cn('rounded-card bg-surface', isActive && 'ring-2 ring-primary', className)} />
```

## Playground

The interactive component smoke test is available at:

```text
http://localhost:5173/components
```

Start the frontend with `npm run dev` from `frontend/`, or start the complete
stack with `make up` from the repository root.