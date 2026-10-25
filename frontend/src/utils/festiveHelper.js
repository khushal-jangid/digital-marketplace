// Auto-Expiry Timer for Diwali Festive UI
// Expiry set to Tomorrow: October 26, 2026 at 11:59:59 PM IST (End of day tomorrow)
export const DIWALI_EXPIRY_TIMESTAMP = new Date('2026-10-26T23:59:59+05:30').getTime();

export const isDiwaliFestiveActive = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('festive') === 'false') return false;
    if (params.get('festive') === 'true') return true;
  }
  return Date.now() < DIWALI_EXPIRY_TIMESTAMP;
};
