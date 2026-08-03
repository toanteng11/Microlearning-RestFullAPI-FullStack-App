import { Download, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { downloadCsvBlob } from '../reporting-download';

export function ExportCsvButton({
  path,
  filename,
  label = 'Tải CSV',
}: {
  path: string;
  filename: string;
  label?: string;
}) {
  const { request } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const blob = await request<Blob>(path, { responseType: 'blob' });
      downloadCsvBlob(blob, filename);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể tải báo cáo CSV. Vui lòng thử lại.',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <span className="export-control">
      <button type="button" onClick={() => void download()} disabled={downloading}>
        {downloading ? (
          <LoaderCircle className="spin-icon" size={17} aria-hidden="true" />
        ) : (
          <Download size={17} aria-hidden="true" />
        )}
        {downloading ? 'Đang tạo CSV' : label}
      </button>
      {error ? (
        <small className="field-error" role="alert">
          {error}
        </small>
      ) : null}
    </span>
  );
}
