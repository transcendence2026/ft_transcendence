import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tag?: string;
  title: string;
}

export const Card: React.FC<CardProps> = ({ className, tag, title, children, ...props }) => {
  return (
	<div 
	  className={cn("font-sans bg-surface border border-border rounded-card p-6 max-w-sm shadow-lg", className)} 
	  {...props}
	>
	  <div className="mb-4">
		{tag && <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{tag}</span>}
		<h3 className="font-serif text-xl font-bold text-text mt-1">{title}</h3>
	  </div>
	  <div className="text-sm text-muted leading-relaxed">
		{children}
	  </div>
	</div>
  );
};
