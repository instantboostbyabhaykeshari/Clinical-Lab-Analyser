export default function SeverityBadge({ severity }) {
  const styles = {
    Critical: "border-red-400/40 bg-red-500/10 text-red-200",
    Warning: "border-amber-300/40 bg-amber-400/10 text-amber-100",
    Normal: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
  };

  const labels = {
    Critical: "HIGH",
    Warning: "WARN",
    Normal: "OK",
  };

  return (
    <span
      className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${styles[severity]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{labels[severity]}</span>
      <span className="text-[11px] normal-case tracking-normal opacity-80">{severity}</span>
    </span>
  );
}
