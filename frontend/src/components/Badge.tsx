import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function Badge({ children, tone = 'muted', className }: { children: ReactNode; tone?: 'accent' | 'muted' | 'success'; className?: string }) {
  const tones = { accent: 'border-primary/40 bg-primary/10 text-primary-soft', muted: 'border-border bg-surface-raised text-muted', success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' };
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}