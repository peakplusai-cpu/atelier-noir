export function Wordmark({ className = "wordmark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 72" role="img" aria-label="CLACK">
      <text x="6" y="52" fill="currentColor" fontFamily="var(--font-marker), 'Permanent Marker', cursive" fontSize="58">
        CLACK
      </text>
      <path d="M38 54c2 8 1 14-1 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M78 56c1 7 4 12 2 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M132 52c3 9 1 15 0 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M196 55c2 6 5 11 3 15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M248 50c2 8 0 14-2 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="58" cy="18" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="214" cy="14" r="2.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
