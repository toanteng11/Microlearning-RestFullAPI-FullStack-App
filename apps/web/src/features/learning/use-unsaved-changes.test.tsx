import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UNSAVED_CHANGES_MESSAGE, useUnsavedChanges } from './use-unsaved-changes';

function EditorFixture() {
  const dirtyRef = useRef(false);
  useUnsavedChanges(dirtyRef);
  return (
    <main>
      <label htmlFor="draft-title">Tiêu đề</label>
      <input
        id="draft-title"
        onChange={() => {
          dirtyRef.current = true;
        }}
      />
      <Link to="/next">Rời trang</Link>
    </main>
  );
}

function renderFixture() {
  const router = createMemoryRouter(
    [
      { path: '/edit', element: <EditorFixture /> },
      { path: '/next', element: <h1>Trang tiếp theo</h1> },
    ],
    { initialEntries: ['/edit'] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUnsavedChanges', () => {
  it('keeps the user on the form when navigation is not confirmed', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { router } = renderFixture();

    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Draft' } });
    fireEvent.click(screen.getByRole('link', { name: 'Rời trang' }));

    await waitFor(() => expect(confirm).toHaveBeenCalledWith(UNSAVED_CHANGES_MESSAGE));
    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.queryByRole('heading', { name: 'Trang tiếp theo' })).not.toBeInTheDocument();
  });

  it('clears the guard and proceeds after navigation is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { router } = renderFixture();

    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Draft' } });
    fireEvent.click(screen.getByRole('link', { name: 'Rời trang' }));

    expect(await screen.findByRole('heading', { name: 'Trang tiếp theo' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/next');
  });

  it('prevents beforeunload when the form is dirty', () => {
    renderFixture();
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Draft' } });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
