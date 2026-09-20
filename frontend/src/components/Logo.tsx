export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* An open arc — a gate that's almost, but not quite, closed — with a
          settlement node marking the point it unlocks at. */}
      <path
        d="M16 4a12 12 0 1 0 8.49 20.49"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="25" cy="7" r="3.4" fill="currentColor" />
    </svg>
  );
}
