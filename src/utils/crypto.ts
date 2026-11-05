/**
 * Utility functions for hashing prompts and formatting metrics
 */

export async function calculatePromptHash(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Simple fallback hash if crypto.subtle is not available
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 16); // 16-char clean fingerprint
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard heuristic ~4 characters per token
  return Math.ceil(text.length / 4);
}
