import { X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

interface ReasonDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function ReasonDialog({
  title,
  description,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: ReasonDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [reason, setReason] = useState('');
  const normalizedReason = reason.trim();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onCancel]);

  return (
    <div className="dialog-backdrop">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="reason-dialog"
        role="dialog"
      >
        <header>
          <div>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button
            aria-label="Đóng hộp thoại"
            className="icon-button"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (normalizedReason.length >= 5) void onConfirm(normalizedReason);
          }}
        >
          <label>
            Lý do
            <textarea
              autoFocus
              maxLength={500}
              minLength={5}
              onChange={(event) => setReason(event.target.value)}
              required
              rows={4}
              value={reason}
            />
          </label>
          <div className="inline-actions reason-dialog__actions">
            <button
              className="button-link button-link--secondary"
              disabled={busy}
              onClick={onCancel}
              type="button"
            >
              Hủy
            </button>
            <button disabled={busy || normalizedReason.length < 5} type="submit">
              {busy ? 'Đang xử lý...' : confirmLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
