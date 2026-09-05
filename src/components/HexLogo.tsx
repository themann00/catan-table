/** Three-hex mark: fields, forest, hills. Same shapes as the app icon. */
export const HexLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
    <g stroke="hsl(var(--wood))" strokeWidth="2.5" strokeLinejoin="round">
      <polygon points="32,4 46,12 46,28 32,36 18,28 18,12" fill="hsl(var(--fields))" />
      <polygon points="18,28 32,36 32,52 18,60 4,52 4,36" fill="hsl(var(--forest))" />
      <polygon points="46,28 60,36 60,52 46,60 32,52 32,36" fill="hsl(var(--hills))" />
    </g>
  </svg>
);
