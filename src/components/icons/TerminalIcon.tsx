/**
 * TerminalIcon - Custom SVG icon component.
 *
 * This icon is used as both the favicon and the logo in the UI.
 * By rendering it as a React component with currentColor, it automatically
 * adapts to the theme (text-accent class).
 */

interface Props {
  className?: string;
  size?: number;
}

export default function TerminalIcon({ className = '', size = 24 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 19h8" />
      <path d="m4 17 6-6-6-6" />
    </svg>
  );
}
