interface LogoProps {
  variant?: 'mark' | 'full';
  size?: number;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function Logo({ variant = 'mark', size = 28, className = '', theme = 'dark' }: LogoProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  // Fundo escuro (sidebar) -> marca branca; fundo claro (login) -> marca azul da marca.
  const src = theme === 'dark' ? '/logo-mark.png' : '/logo-mark-blue.png';

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Dripfy"
      width={size}
      height={size}
      className="flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
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
