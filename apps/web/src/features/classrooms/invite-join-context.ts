import { createContext, useContext } from 'react';

export interface InviteJoinContextValue {
  token: string | null;
  captureFromLocation: () => string | null;
  clear: () => void;
}

export const InviteJoinContext = createContext<InviteJoinContextValue | null>(null);

export function useInviteJoin() {
  const context = useContext(InviteJoinContext);
  if (!context) throw new Error('useInviteJoin must be used inside InviteJoinProvider');
  return context;
}
