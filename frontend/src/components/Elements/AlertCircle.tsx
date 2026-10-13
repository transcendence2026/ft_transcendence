import type { SVGProps } from 'react';

export default function AlertCircle({
  className = 'h-4 w-4',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeWidth={2}
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01"
      />
    </svg>
  );
}