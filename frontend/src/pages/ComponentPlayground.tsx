import { useState, type CSSProperties } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';

const defaultTheme = {
  primary: '#ef6540',
  primaryHover: '#ff7955',
  primarySoft: '#ffb4a1',
  secondary: '#fabc4d',
  background: '#141312',
  backgroundDeep: '#0f0e0d',
  surface: '#1d1b1a',
  surfaceRaised: '#2b2a28',
  border: '#363433',
  text: '#e6e1df',
  textStrong: '#f8f6f2',
  textSoft: '#e0bfb7',
  muted: '#a88a83',
};

type ThemeTokens = typeof defaultTheme;

const themeLabels: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'primaryHover', label: 'Primary hover' },
  { key: 'primarySoft', label: 'Primary soft' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'backgroundDeep', label: 'Deep background' },
  { key: 'surface', label: 'Surface' },
  { key: 'surfaceRaised', label: 'Raised surface' },
  { key: 'border', label: 'Border' },
  { key: 'text', label: 'Text' },
  { key: 'textStrong', label: 'Strong text' },
  { key: 'textSoft', label: 'Soft text' },
  { key: 'muted', label: 'Muted text' },
];

export default function ComponentPlayground() {
  const [email, setEmail] = useState('tester@example.com');
  const [showModal, setShowModal] = useState(false);
  const [theme, setTheme] = useState<ThemeTokens>(defaultTheme);

  const themeStyle = Object.fromEntries(
    Object.entries(theme).map(([token, value]) => [
      `--color-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      value,
    ]),
  ) as CSSProperties;

  const updateTheme = (token: keyof ThemeTokens, value: string) => {
    setTheme((currentTheme) => ({ ...currentTheme, [token]: value }));
  };

  return (
    <main style={themeStyle} className="min-h-screen bg-background px-6 py-10 font-sans text-text sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Component lab</p>
          <h1 className="mt-2 font-serif text-4xl text-text-strong tracking-[-0.04em]">Shared UI playground</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            A local page for checking the shared components and tuning their visual language.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
          <div className="grid gap-6 sm:grid-cols-2">
          <Card tag="Actions" title="Button variants">
            <div className="flex flex-wrap gap-3">
              <Button type="button">Primary</Button>
              <Button type="button" variant="secondary">Secondary</Button>
              <Button type="button" variant="ghost">Ghost</Button>
              <Button type="button" variant="danger">Danger</Button>
            </div>
          </Card>

          <Card tag="Forms" title="Input states">
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input label="Invalid field" defaultValue="bad value" error="Please enter a valid value." />
            </div>
          </Card>

          <Card tag="Feedback" title="Loading state">
            <Loader label="Connecting to the table..." />
          </Card>

          <Card tag="Overlay" title="Modal state">
            <p className="mb-5">Open the modal to verify the overlay, focus target, and footer actions.</p>
            <Button type="button" onClick={() => setShowModal(true)}>Open modal</Button>
          </Card>
          </div>

          <Card tag="Live theme" title="Tune the palette" className="max-w-none self-start">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
              <p className="text-xs leading-relaxed text-muted">Changes apply instantly to this sandbox only.</p>
              <Button type="button" variant="ghost" className="shrink-0 px-2 text-xs" onClick={() => setTheme(defaultTheme)}>
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {themeLabels.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-2 text-xs text-text-soft">
                  <span>{label}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(event) => updateTheme(key, event.target.value)}
                      className="h-8 w-8 cursor-pointer rounded-control border border-border bg-transparent p-0.5"
                      aria-label={`${label} color`}
                    />
                    <span className="hidden font-mono text-[10px] text-muted xl:inline">{theme[key]}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Component check"
        footerActions={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="button" onClick={() => setShowModal(false)}>Looks good</Button>
          </>
        }
      >
        This dialog is rendered by the shared Modal component and can be dismissed from either action.
      </Modal>
    </main>
  );
}