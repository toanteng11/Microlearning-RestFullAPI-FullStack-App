import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { InviteJoinContext, type InviteJoinContextValue } from './invite-join-context';

function tokenFromFragment(fragment: string): string | null {
  const params = new URLSearchParams(fragment.startsWith('#') ? fragment.slice(1) : fragment);
  const value = params.get('token')?.trim();
  return value || null;
}

export function InviteJoinProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const captureFromLocation = useCallback(() => {
    const captured = tokenFromFragment(window.location.hash);
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
    if (captured) setToken(captured);
    return captured;
  }, []);
  const clear = useCallback(() => setToken(null), []);
  const value = useMemo<InviteJoinContextValue>(
    () => ({
      token,
      captureFromLocation,
      clear,
    }),
    [captureFromLocation, clear, token],
  );
  return <InviteJoinContext.Provider value={value}>{children}</InviteJoinContext.Provider>;
}
