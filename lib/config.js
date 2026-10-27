export const server = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Base URL of the Quran API; the hadith endpoints live under `${apiBaseUrl}/hadith`.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8090/api";

export const config = {
  language: "vi", // default content language, sent to the API as {localizationCode}
  apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
  measurementId: process.env.MEASUREMENT_ID,
  apiFetchTimeout: 15000, // ms
  perPage: 20, // hadiths per page on paginated lists (the API allows up to 100)
};
