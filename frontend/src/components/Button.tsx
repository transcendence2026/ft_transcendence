import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
	const baseStyles = 'font-sans text-sm font-medium px-4 py-2 rounded-control inline-flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none';
	
	const variants = {
	  primary: 'bg-primary text-background hover:bg-primary-hover shadow-action focus:ring-primary/50',
	  secondary: 'bg-secondary text-background hover:opacity-90 focus:ring-secondary/50',
	  ghost: 'bg-transparent text-text hover:bg-surface focus:ring-border/50',
	  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50',
	};

	return (
	  <button
		ref={ref}
		className={cn(baseStyles, variants[variant], className)}
		{...props}
	  />
	);
  }
);

Button.displayName = 'Button';
