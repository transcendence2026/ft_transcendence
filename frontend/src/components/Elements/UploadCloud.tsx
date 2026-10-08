import type { SVGProps } from 'react';

export default function UploadCloud({
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5.002 5.002 0 0116.9 6H17a4 4 0 010 8M12 12v8m0-8l-3 3m3-3l3 3"
      />
    </svg>
  );
}