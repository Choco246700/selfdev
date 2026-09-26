import { useEffect, useState } from 'react';
import { offlineQueue } from '../utils/offlineQueue';

export function usePendingQueue(): number {
  const [count, setCount] = useState(() => offlineQueue.size());

  useEffect(() => {
    const update = () => setCount(offlineQueue.size());

    window.addEventListener('skilltrack:queue-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('skilltrack:queue-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return count;
}