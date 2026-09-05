import * as React from "react";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer subtle layer */}
      <rect width="240" height="240" rx="56" className="fill-brand/0" />
      {/* Main vibrant base */}
      <rect x="24" y="24" width="192" height="192" rx="44" className="fill-brand" />
      
      {/* The "G" shape */}
      <path
        d="M 160 110 V 140 C 160 162.091 142.091 180 120 180 C 97.9086 180 80 162.091 80 140 C 80 117.909 97.9086 100 120 100 C 131.046 100 141.046 104.477 148.284 111.716"
        className="stroke-bg-primary"
        strokeWidth="28"
        strokeLinecap="round"
      />
      <path
        d="M 116 140 H 160"
        className="stroke-bg-primary"
        strokeWidth="28"
        strokeLinecap="round"
      />
      
      {/* Accent dot */}
      <circle cx="160" cy="88" r="14" className="fill-bg-primary" />
    </svg>
  );
}
