export default function Logo({ size = "text-2xl" }) {
  return (
    <span className={`font-black italic tracking-tighter ${size}`}>
      <span className="text-ink-900">lidu</span>
      <span className="text-brand-500">ka</span>
    </span>
  );
}