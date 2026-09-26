import { useCallback, useRef, useState } from 'react';

export function useSaveAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<void>,
  { cooldownMs = 500 }: { cooldownMs?: number } = {}
) {
  const [isSaving, setIsSaving] = useState(false);
  const inFlightRef = useRef(false);
  const lastRunRef = useRef(0);

  const run = useCallback(
    async (...args: TArgs): Promise<boolean> => {
      if (inFlightRef.current) return false;
      if (Date.now() - lastRunRef.current < cooldownMs) return false;

      inFlightRef.current = true;
      setIsSaving(true);
      lastRunRef.current = Date.now();

      try {
        await action(...args);
        return true;
      } finally {
        inFlightRef.current = false;
        setIsSaving(false);
      }
    },
    [action, cooldownMs]
  );

  return { run, isSaving };
}