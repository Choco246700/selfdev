/**
 * Detects whether an error is a network/connectivity failure
 * (as opposed to a server-side validation or DB error).
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;

  // Browser fetch failures throw TypeError
  if (err instanceof TypeError) return true;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);

  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('err_internet') ||
    lower.includes('err_network') ||
    lower.includes('timeout')
  );
}