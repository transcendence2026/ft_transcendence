import { cn } from '../utils/cn';

type Presence = 'online' | 'offline' | 'ingame';

interface AvatarProps {
  name: string;
  src?: string | null;
  presence?: Presence;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-14 w-14 text-base', lg: 'h-24 w-24 text-2xl', xl: 'h-32 w-32 text-4xl' };
const presenceColors = { online: 'bg-emerald-400', ingame: 'bg-secondary', offline: 'bg-muted' };

export function Avatar({ name, src, presence, size = 'md', className }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase() || 'U';
  return <div className={cn('relative shrink-0', className)}>
    <div className={cn('flex overflow-hidden rounded-full border border-primary/60 bg-surface-raised font-serif text-primary-soft', sizes[size])}>
      {src ? <img src={src} alt={`${name}'s avatar`} className="h-full w-full object-cover" /> : initials}
    </div>
    {presence && <span className={cn('absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background', presenceColors[presence])} aria-label={presence} />}
  </div>;
}