/**
 * AutoDash AI – shared API base URL (default http://127.0.0.1:8001).
 * Set NEXT_PUBLIC_API_URL in .env.local to override.
 */
export const API_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001")
    : "http://127.0.0.1:8001";

export default API_BASE;
