// Exposed to the browser bundle by next.config.js `env`; empty = no analytics.
export const GA_TRACKING_ID = process.env.GOOGLE_ANALYTICS_ID;

const enabled = () => Boolean(GA_TRACKING_ID) && typeof window !== "undefined" && typeof window.gtag === "function";

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url) => {
  if (!enabled()) return;
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  if (!enabled()) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
