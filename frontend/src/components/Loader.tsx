import React from 'react';
import { cn } from '../utils/cn';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({ className, label, ...props }) => {
  return (
	<div 
	  className={cn("flex flex-col items-center justify-center gap-3 p-8 font-sans", className)} 
	  {...props}
	>
	  <svg 
		className="animate-spin h-8 w-8 text-primary" 
		xmlns="http://w3.org" 
		fill="none" 
		viewBox="0 0 24 24" 
		role="status" 
		aria-label={label || "Loading"}
	  >
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
	  </svg>
	  {label && (
		<span className="text-xs font-medium text-text-soft tracking-wide animate-pulse">
		  {label}
		</span>
	  )}
	</div>
  );
};
