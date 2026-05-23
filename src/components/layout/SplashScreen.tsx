/**
 * Luxury splash shown while the dashboard server-renders. The diamond logo
 * draws itself (stroke-dashoffset) while a saturate filter brings the gradient
 * from greyscale to full colour. The FinLux wordmark slides up afterwards.
 */
export function SplashScreen() {
  return (
    <div className="finlux-splash bg-background fixed inset-0 z-[200] flex flex-col items-center justify-center">
      <span aria-hidden className="finlux-splash__glow" />
      <svg
        viewBox="0 0 100 100"
        width={120}
        height={120}
        role="img"
        aria-label="FinLux"
        className="finlux-splash__logo"
      >
        <defs>
          <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a2be2" />
            <stop offset="100%" stopColor="#4b0082" />
          </linearGradient>
        </defs>
        <path
          className="finlux-splash__diamond"
          d="M50 10 L85 50 L50 90 L15 50 Z"
          fill="none"
          stroke="url(#splashGradient)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          className="finlux-splash__letters"
          d="M42 35 L65 35 M42 35 L42 65 L58 65"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className="finlux-splash__spark" cx="85" cy="50" r="3" fill="#8a2be2" />
      </svg>
      <h1 className="finlux-splash__name text-headline-lg text-primary mt-md font-sans font-semibold tracking-tight">
        FinLux
      </h1>
      <p className="finlux-splash__tagline text-label-sm text-on-surface-variant mt-xs font-mono tracking-widest uppercase">
        Digital Luxury Finance
      </p>
    </div>
  );
}
