export const server = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"; // External API server

export const config = {
  language: "vi",
  apiBaseUrl: apiBaseUrl,
  measurementId: process.env.MEASUREMENT_ID,
  enableMultiTranslations: true,
  useApiOnly: true, // Force API-only mode
  apiFetchTimeout: 30000, // 30 seconds timeout
  apiRetryAttempts: 3, // Retry failed requests
};