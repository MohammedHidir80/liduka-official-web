// components/VerifiedBadge.js — the blue "verified vendor" tick (set from the admin Vendors page: users/{id}.verified)
export default function VerifiedBadge({ size = 16, className = "" }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="#fff" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Verified vendor"
      className={`inline-block text-brand-600 ${className}`}
    >
      <title>Verified vendor</title>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.75Z" />
      <path d="m9 12 2 2 4-4" fill="none" />
    </svg>
  );
}