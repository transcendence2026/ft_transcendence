import React, { useEffect } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footerActions }) => {
  // Deshabilitar scroll del body cuando el modal está abierto
  useEffect(() => {
	if (isOpen) {
	  document.body.style.overflow = 'hidden';
	} else {
	  document.body.style.overflow = '';
	}
	return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
	<div 
	  className="fixed inset-0 z-50 flex items-center justify-center p-4" 
	  role="dialog" 
	  aria-modal="true" 
	  aria-labelledby="modal-title"
	>
	  {/* Backdrop */}
	  <div 
		className="fixed inset-0 bg-background-deep/80 backdrop-blur-sm transition-opacity" 
		onClick={onClose}
	  />

	  {/* Modal Content */}
	  <div className="relative bg-surface border border-border rounded-card max-w-md w-full p-6 shadow-2xl z-10 font-sans animate-in fade-in zoom-in-95 duration-200">
		
		{/* Header */}
		<div className="flex items-center justify-between border-b border-border pb-4 mb-4">
		  <h2 id="modal-title" className="font-serif text-xl font-bold text-text">
			{title}
		  </h2>
		  <button 
			onClick={onClose}
			aria-label="Close modal" 
			className="text-muted hover:text-text transition-colors p-1 rounded-control focus:outline-none focus:ring-2 focus:ring-primary/50"
		  >
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		  </button>
		</div>

		{/* Body */}
		<div className="mb-6 text-sm text-muted leading-relaxed">
		  {children}
		</div>

		{/* Footer */}
		{footerActions && (
		  <div className="flex justify-end gap-3 border-t border-border pt-4">
			{footerActions}
		  </div>
		)}
	  </div>
	</div>
  );
};
