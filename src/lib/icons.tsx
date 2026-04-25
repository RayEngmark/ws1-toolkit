// Minimal stroke icons — VS Code Codicon style
// 16x16 viewport, 1.5px stroke, currentColor

interface IconProps {
  size?: number;
}

function Svg({ size = 16, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
  </Svg>
);

export const DeviceIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.5" y="3" width="13" height="8" rx="0.5" />
    <path d="M5 14h6M8 11v3" />
  </Svg>
);

export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 7v-4a1 1 0 0 1 1-1h4l7 7-5 5-7-7z" />
    <circle cx="5" cy="5" r="0.7" fill="currentColor" />
  </Svg>
);

export const FolderTreeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M1.5 3.5h4l1 1h8v8h-13z" />
    <path d="M4 10.5h3M4 8h5" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5l3.5 3.5" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8l3 3 7-7" />
  </Svg>
);

export const XIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3l10 10M13 3L3 13" />
  </Svg>
);

export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3l5 5-5 5" />
  </Svg>
);

export const ChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6l5 5 5-5" />
  </Svg>
);

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3v3h-3" />
    <path d="M13 6a5.5 5.5 0 1 0 1.2 3" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l1 10h6l1-10M6.5 7v5M9.5 7v5" />
  </Svg>
);

export const ConnectIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4L4 2 2 4l2 2M10 4l2-2 2 2-2 2M5 5l6 6M10 12l-2 2-2-2 2-2M12 10l-2-2" />
  </Svg>
);

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 3l9 5-9 5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const CircleFilled = ({ size = 8 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 8"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="4" cy="4" r="3.5" fill="currentColor" />
  </svg>
);
