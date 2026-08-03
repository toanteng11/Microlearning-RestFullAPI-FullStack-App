interface AdminSummaryEntry {
  label: string;
  value: number | string;
}

export function AdminSummary({
  title,
  entries,
}: {
  title: string;
  entries: readonly AdminSummaryEntry[];
}) {
  return (
    <section className="work-panel admin-summary" aria-labelledby={`summary-${title}`}>
      <h2 id={`summary-${title}`}>{title}</h2>
      <dl>
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt>{entry.label}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
