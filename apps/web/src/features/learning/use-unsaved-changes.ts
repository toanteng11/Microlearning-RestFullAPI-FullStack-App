import { useEffect, type RefObject } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

export const UNSAVED_CHANGES_MESSAGE =
  'Bạn có thay đổi chưa lưu. Rời trang sẽ làm mất những thay đổi này. Bạn có muốn tiếp tục?';

export function useUnsavedChanges(dirtyRef: RefObject<boolean>, message = UNSAVED_CHANGES_MESSAGE) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!dirtyRef.current) return false;
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    );
  });

  useBeforeUnload((event) => {
    if (!dirtyRef.current) return;
    event.preventDefault();
    event.returnValue = '';
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) {
      dirtyRef.current = false;
      blocker.proceed();
      return;
    }
    blocker.reset();
  }, [blocker, dirtyRef, message]);
}
