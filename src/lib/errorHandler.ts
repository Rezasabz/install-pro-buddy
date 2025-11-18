/**
 * Extract error message from API error
 */
export function extractErrorMessage(error: any, defaultMessage: string = "خطا در انجام عملیات"): string {
  if (!error) return defaultMessage;
  
  // Check if error has a message
  if (error.message) {
    // Try to extract detail from JSON error
    const match = error.message.match(/{"detail":"([^"]+)"}/);
    if (match) {
      return match[1];
    }
    
    // Try to parse as JSON
    try {
      const jsonMatch = error.message.match(/{.*}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.detail) {
          return parsed.detail;
        }
      }
    } catch {
      // Not JSON, continue
    }
    
    // Return the message as is if it doesn't contain "API Error"
    if (!error.message.includes('API Error:')) {
      return error.message;
    }
  }
  
  return defaultMessage;
}
