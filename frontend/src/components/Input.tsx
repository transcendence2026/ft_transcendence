import React, { useId } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
	const errorId = useId();

	return (
	  <div className="font-sans w-full max-w-sm">
		<label 
		  className={cn(
			"block text-xs font-medium mb-1.5 transition-colors",
			error ? "text-red-400" : "text-text-soft"
		  )}
		>
		  {label}
		</label>
		
		<div className="relative">
		  {icon && (
			<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted pointer-events-none">
			  {icon}
			</span>
		  )}
		  
		  <input
			ref={ref}
			type={type}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
			className={cn(
			  "w-full bg-surface-raised border text-text placeholder-muted text-sm rounded-control py-2.5 transition-colors focus:outline-none focus:ring-1",
			  icon ? "pl-10 pr-4" : "px-4",
			  error 
				? "border-red-500 focus:border-red-500 focus:ring-red-500" 
				: "border-border focus:border-primary focus:ring-primary"
			)}
			{...props}
		  />
		</div>

		{error && (
		  <p id={errorId} className="text-xs text-red-400 mt-1.5 animate-fade-in">
			{error}
		  </p>
		)}
	  </div>
	);
  }
);

Input.displayName = 'Input';
