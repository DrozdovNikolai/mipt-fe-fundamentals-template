type IconName =
  | "plus"
  | "search"
  | "edit"
  | "trash"
  | "menu"
  | "settings"
  | "image"
  | "stop"
  | "send"
  | "refresh"
  | "warning"
  | "spark"
  | "copy"
  | "close";

interface IconProps {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20 }: IconProps) {
  const commonProps = {
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
  };

  switch (name) {
    case "plus":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "search":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "edit":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
          <path d="m12 6 4 4" />
        </svg>
      );
    case "trash":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M4 7h16" />
          <path d="M9 3h6l1 2H8l1-2Z" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );
    case "menu":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.1a1 1 0 0 0-.9.6Z" />
        </svg>
      );
    case "image":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <path d="m7 15 3.5-3.5 3 3L16 12l2.5 3" />
          <circle cx="8.5" cy="9" r="1.2" />
        </svg>
      );
    case "stop":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      );
    case "send":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M21 3 10 14" />
          <path d="m21 3-7 18-4-7-7-4 18-7Z" />
        </svg>
      );
    case "refresh":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M20 11a8 8 0 1 0 2 5.5" />
          <path d="M20 4v7h-7" />
        </svg>
      );
    case "warning":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M12 4 3 20h18L12 4Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "spark":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3Z" />
          <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
          <path d="m5 14 .9 2.4L8.3 17l-2.4.9L5 20.3l-.9-2.4L1.7 17l2.4-.9L5 14Z" />
        </svg>
      );
    case "copy":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "close":
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    default:
      return null;
  }
}
