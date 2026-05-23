interface LogoProps {
  size?: number;
  className?: string;
  /** Sometimes the inner FL letters need to match the surface (e.g. light card). */
  letterColor?: string;
  /** When true, draws a slight glow behind the diamond — used on landing/auth screens. */
  glow?: boolean;
}

export function Logo({ size = 48, className, letterColor = "white", glow = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="FinLux"
      className={className}
    >
      <defs>
        <linearGradient id="finluxLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a2be2" />
          <stop offset="100%" stopColor="#4b0082" />
        </linearGradient>
        {glow ? (
          <filter id="finluxLogoGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}
      </defs>
      <g filter={glow ? "url(#finluxLogoGlow)" : undefined}>
        <path
          d="M50 10 L85 50 L50 90 L15 50 Z"
          fill="none"
          stroke="url(#finluxLogoGradient)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M42 35 L65 35 M42 35 L42 65 L58 65"
          fill="none"
          stroke={letterColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="85" cy="50" r="3" fill="#8a2be2" />
      </g>
    </svg>
  );
}
