export function ProgressBar({ value, label }: { value: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-meter">
      <div
        className="progress-meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <span style={{ width: `${normalized}%` }} />
      </div>
      <strong>{normalized}%</strong>
    </div>
  );
}
