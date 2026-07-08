/**
 * Returns a persistent anonymous session ID stored in localStorage.
 * Used for product view tracking without requiring login.
 */
export function getSessionId(): string {
  const key = 'bowri_sid';
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(key, sid);
  }
  return sid;
}
