/* Minimal inline icons for the dock (no icon-font dependency). */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconSidebar = () => (
  <svg {...base}>
    <rect x="2.5" y="3.5" width="19" height="17" rx="2" />
    <path d="M10 3.5v17" />
    <path d="M5.6 8.5h1.4M5.6 12h1.4" />
  </svg>
);
export const IconGrid = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const IconLeft = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconRight = () => (
  <svg {...base}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconPencil = () => (
  <svg {...base}>
    <path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17z" />
  </svg>
);
export const IconExpand = () => (
  <svg {...base}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconShrink = () => (
  <svg {...base}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);
export const IconPresent = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);
export const IconClose = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconCamera = () => (
  <svg {...base}>
    <path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
    <circle cx="12" cy="13.2" r="3.4" />
  </svg>
);
export const IconImages = () => (
  <svg {...base}>
    <rect x="5.5" y="5.5" width="16" height="12.5" rx="1.8" />
    <path d="M2.8 8v9.5A2.5 2.5 0 0 0 5.3 20H18" />
    <path d="M5.5 15.5l4.4-4 3.6 3.4 2.4-2 5.6 4.6" />
    <circle cx="10.6" cy="9.4" r="0.4" />
  </svg>
);
export const IconZoom = () => (
  <svg {...base}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.4 15.4L21 21" />
    <path d="M7.8 10.5h5.4M10.5 7.8v5.4" />
  </svg>
);
export const IconNote = () => (
  <svg {...base}>
    <path d="M4.5 4.5h15v9.5l-5.5 5.5h-9.5z" />
    <path d="M14 19.5V14h5.5" />
    <path d="M8 9h8M8 12.5h4.5" />
  </svg>
);
export const IconReplay = () => (
  <svg {...base}>
    <path d="M4.6 11a7.5 7.5 0 1 1 2.2 6" />
    <path d="M4.2 12.8V8.2h4.6" transform="translate(0.4 3)" />
    <path d="M10.4 9.2l4.6 2.8-4.6 2.8z" fill="currentColor" strokeWidth="1" />
  </svg>
);
