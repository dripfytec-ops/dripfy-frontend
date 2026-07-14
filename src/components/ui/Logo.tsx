interface LogoProps {
  variant?: 'mark' | 'full';
  size?: number;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function Logo({ variant = 'mark', size = 28, className = '', theme = 'dark' }: LogoProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="dripfy-logo-grad" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#dripfy-logo-grad)" />
      <path
        d="M16 7c3.6 4.2 5.8 7.5 5.8 10.4a5.8 5.8 0 1 1-11.6 0C10.2 14.5 12.4 11.2 16 7Z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={className}>{mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span className={`font-semibold tracking-tight ${textColor}`} style={{ fontSize: size * 0.72 }}>
        Dripfy
      </span>
    </span>
  );
}
