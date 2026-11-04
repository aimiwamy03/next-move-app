import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
    </svg>
  );
}

export function AudioWaveformIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 10v4M8.5 7.5v9M12 5v14M15.5 8v8M19 10.5v3" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m5 12.5 4.25 4.25L19 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5V17" />
      <path d="M12 7.2h.01" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M19.5 4.5c-6.5.1-11 2.3-13 6.2-1.5 3-.3 6 2 7.1 2.9 1.5 6-.1 7.2-2.6 1.2-2.6.3-5.5 3.8-10.7Z" />
      <path d="M5 20c2.2-5.2 5.7-8.6 10.5-10.4" />
    </svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9.6 9.6 0 0 1-3.4-.7L4 20l1.3-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7.5 4.5 10 8 8.3 10a14 14 0 0 0 5.7 5.7l2-1.7 3.5 2.5-1.2 2a2.4 2.4 0 0 1-2.7 1.1C9.7 17.9 6.1 14.3 4.4 8.4a2.4 2.4 0 0 1 1.1-2.7l2-1.2Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 7v5h-5" />
      <path d="M18.5 15.5A7.5 7.5 0 1 1 19 8l1 4" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3c.4 3.6 2.4 5.6 6 6-3.6.4-5.6 2.4-6 6-.4-3.6-2.4-5.6-6-6 3.6-.4 5.6-2.4 6-6Z" />
      <path d="M18.5 15.5c.2 1.5 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-1 2.5-2.5Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function CellularIcon(props: IconProps) {
  return (
    <svg fill="currentColor" stroke="none" viewBox="0 0 18 12" aria-hidden="true" {...props}>
      <rect x="0" y="8" width="3" height="4" rx="0.8" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
      <rect x="10" y="3" width="3" height="9" rx="0.8" />
      <rect x="15" y="0" width="3" height="12" rx="0.8" />
    </svg>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <svg fill="currentColor" stroke="none" viewBox="0 0 18 13" aria-hidden="true" {...props}>
      <path d="M9 12.8 6.8 10.6a3.1 3.1 0 0 1 4.4 0L9 12.8Zm4.4-4.4-1.5 1.5a4.1 4.1 0 0 0-5.8 0L4.6 8.4a6.2 6.2 0 0 1 8.8 0Zm3-3-1.5 1.5a8.3 8.3 0 0 0-11.8 0L1.6 5.4a10.4 10.4 0 0 1 14.8 0Z" />
    </svg>
  );
}

export function BatteryIcon(props: IconProps) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 28 13" aria-hidden="true" {...props}>
      <rect x="0.75" y="0.75" width="23" height="11.5" rx="3" strokeOpacity=".35" strokeWidth="1.5" />
      <rect x="2.5" y="2.5" width="19.5" height="8" rx="1.5" fill="currentColor" stroke="none" />
      <path d="M25 4.25v4.5c1.3-.4 2-1.2 2-2.25s-.7-1.85-2-2.25Z" fill="currentColor" stroke="none" opacity=".4" />
    </svg>
  );
}
