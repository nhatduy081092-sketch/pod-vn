import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconMenu = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 5h18M9 12h12M3 19h18M3 9.5l3 2.5-3 2.5" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const IconCart = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
    <circle cx="10" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
  </svg>
);
export const IconPackage = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconPhone = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
export const IconUpload = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const IconStar = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3L2.9 9.4l6.3-.9L12 2.8Z" />
  </svg>
);
export const IconSparkle = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 0c.6 6 1.9 9.4 12 12-10.1 2.6-11.4 6-12 12-.6-6-1.9-9.4-12-12C10.1 9.4 11.4 6 12 0Z" />
  </svg>
);
export const IconTruck = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconBrush = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M18 3 9 12l3 3 9-9-3-3ZM9 12c-3 0-4 2-4 4 0 1.5-1 2.5-2 3 3 1 7 .5 8-3" />
  </svg>
);
export const IconLayers = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
export const IconWallet = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 15h2" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconFilter = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
export const IconText = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 6V4h16v2M12 4v16M8 20h8" />
  </svg>
);
export const IconImage = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);
export const IconUndo = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
);
export const IconRedo = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);
export const IconPalette = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.2-2.2 1.2-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </svg>
);
export const IconSave = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v5h7M8 21v-7h8v7" />
  </svg>
);
