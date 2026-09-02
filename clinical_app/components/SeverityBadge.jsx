export default function SeverityBadge({ severity }) {
  const styles = {
    Critical: "bg-red-100 text-red-800 border-red-300",
    Warning: "bg-amber-100 text-amber-800 border-amber-300",
    Normal: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  const icon = severity === "Normal" ? "✓" : "!";

  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-md border px-3 py-1 text-sm font-semibold ${styles[severity]}`}
    >
      <span className="mr-2">{icon}</span>
      {severity}
    </span>
  );
}
