export function useMetaPixel() {
  const getFbp = (): string | undefined => {
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match?.[1];
  };

  const getFbc = (): string | undefined => {
    const cookieMatch = document.cookie.match(/_fbc=([^;]+)/);
    if (cookieMatch) return cookieMatch[1];
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
    return undefined;
  };

  const generateEventId = (eventName: string): string => {
    return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  };

  // Browser pixel fire — eventID দিয়ে server event এর সাথে deduplicate হবে
  const firePixelEvent = (
    eventName: string,
    data: Record<string, unknown>,
    eventId: string,
  ) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, data, { eventID: eventId });
    }
  };

  return { getFbp, getFbc, generateEventId, firePixelEvent };
}
