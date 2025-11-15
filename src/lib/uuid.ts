// UUID Generator with fallback for older browsers and non-secure contexts

export function generateUUID(): string {
  // Try native crypto.randomUUID first (modern browsers, HTTPS)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to polyfill
    }
  }

  // Polyfill for older browsers or HTTP contexts
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Alternative using timestamp + random for better uniqueness
export function generateUUIDv4(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}-${randomPart}-${randomPart2}`;
}
