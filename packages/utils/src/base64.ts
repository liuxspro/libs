/**
 * Encodes a string to Base64 format using TextEncoder and btoa.
 *
 * @param content - The UTF-8 string to be encoded to Base64
 * @returns The Base64 encoded string representation of the input
 *
 * @example
 * ```typescript
 * encode("Hello World"); // Returns "SGVsbG8gV29ybGQ="
 * ```
 */
export function encode(content: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  return btoa(data.reduce((sum, arr) => sum + String.fromCharCode(arr), ""));
}

/**
 * Decodes a Base64 string back to its original UTF-8 string representation.
 *
 * @param base64_content - The Base64 encoded string to be decoded
 * @returns The original UTF-8 string decoded from Base64
 *
 * @example
 * ```typescript
 * decode("SGVsbG8gV29ybGQ="); // Returns "Hello World"
 * ```
 */
export function decode(base64_content: string) {
  return new TextDecoder().decode(
    Uint8Array.from(atob(base64_content), (c) => c.charCodeAt(0)),
  );
}
