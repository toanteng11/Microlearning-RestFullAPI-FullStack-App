import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '../../../shared/auth/auth-context';
import { ExportCsvButton } from './ExportCsvButton';

describe('ExportCsvButton', () => {
  it('creates and revokes a one-time object URL after a successful download', async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const createObjectURL = vi.fn().mockReturnValue('blob:phase-six-export');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const request = vi.fn().mockResolvedValue(new Blob(['safe,csv'], { type: 'text/csv' }));
    const auth = {
      status: 'authenticated',
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      request,
      updateUser: vi.fn(),
      hasPermission: vi.fn(),
    } as unknown as AuthContextValue;

    render(
      <AuthContext.Provider value={auth}>
        <ExportCsvButton path="/export" filename="report.csv" />
      </AuthContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tải CSV' }));

    await waitFor(() => expect(request).toHaveBeenCalledWith('/export', { responseType: 'blob' }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:phase-six-export');
    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it('shows a stable error and does not create a stale download', async () => {
    const auth = {
      status: 'authenticated',
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      request: vi.fn().mockRejectedValue(new Error('network')),
      updateUser: vi.fn(),
      hasPermission: vi.fn(),
    } as unknown as AuthContextValue;
    render(
      <AuthContext.Provider value={auth}>
        <ExportCsvButton path="/export" filename="report.csv" />
      </AuthContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tải CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải báo cáo CSV');
  });
});
