import { useId } from "react";

/** Veluno brand mark — dark tile, neon orbital ring, V + lightning bolt. */
export default function VelunoLogo({ size = "md", className = "" }) {
  const uid = useId().replace(/:/g, "");
  const box =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const px = size === "sm" ? 36 : size === "lg" ? 56 : 40;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${box} ${className}`}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-75 blur-md" />
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        className="relative rounded-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/25"
      >
        <defs>
          <linearGradient id={`${uid}-ring`} x1="8" y1="6" x2="56" y2="58">
            <stop offset="0" stopColor="#818cf8" />
            <stop offset="0.45" stopColor="#e879f9" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id={`${uid}-v`} x1="18" y1="20" x2="46" y2="48">
            <stop offset="0" stopColor="#c7d2fe" />
            <stop offset="0.5" stopColor="#d8b4fe" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id={`${uid}-bolt`} x1="28" y1="14" x2="44" y2="42">
            <stop offset="0" stopColor="#fde047" />
            <stop offset="1" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="#0f172a" />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={`url(#${uid}-ring)`}
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <path
          d="M20 22 L32 46 L44 22"
          fill="none"
          stroke={`url(#${uid}-v)`}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 18 L38 30 L30 30 L36 42"
          fill="none"
          stroke={`url(#${uid}-bolt)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="40" r="3" fill="#22d3ee" />
      </svg>
    </span>
  );
}
