/** @type {import('next').NextConfig} */

const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require("next/constants");
const countries = require("./config/countries.json");

// One build per country: NEXT_PUBLIC_ values are inlined at build time (docs/DEPLOY.md).
// `next build` stops here, before compiling anything, when the build would make a site
// that cannot work: an unknown country, or (production) a local or missing site URL, or
// an API the browser cannot call from an https page. ALLOW_LOCAL_BUILD=1 lets a local
// test build use local URLs; such a build must never be deployed.

const COUNTRY_FIELDS = ["name", "localization", "language", "ui", "ogLocale"];
const LOCAL_HOST = /^(localhost|.+\.localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[::1?\])$/i;

const countryCodes = () => Object.keys(countries).filter((key) => key !== "_comment");

function fail(problem, fix) {
  const error = new Error(`[hadith] ${problem}${fix ? `\n  ${fix}` : ""}\n  See docs/DEPLOY.md.`);
  error.stack = error.message; // the message is the whole story; no config stack trace
  throw error;
}

// NEXT_PUBLIC_COUNTRY_CODE must name an entry of config/countries.json. Builds must say
// which country they are for; `next dev` defaults to vn (lib/sites.js).
function checkCountry({ required }) {
  const code = process.env.NEXT_PUBLIC_COUNTRY_CODE;
  const known = countryCodes();
  if (!code) {
    if (required) {
      fail("NEXT_PUBLIC_COUNTRY_CODE is not set.", `Each build is one country's site: set it to one of ${known.join(", ")}.`);
    }
    return;
  }
  if (!known.includes(code)) {
    fail(`NEXT_PUBLIC_COUNTRY_CODE="${code}" is not a country of config/countries.json.`, `Use one of ${known.join(", ")}.`);
  }
  const missing = COUNTRY_FIELDS.filter((field) => !countries[code][field]);
  if (missing.length) {
    fail(`config/countries.json "${code}" has no ${missing.join(", ")}.`);
  }
}

function parseUrl(name) {
  const value = process.env[name];
  if (!value) return { missing: true };
  try {
    const url = new URL(value);
    return { url, local: LOCAL_HOST.test(url.hostname) };
  } catch (_) {
    return fail(`${name}="${value}" is not an absolute URL.`);
  }
}

// Production builds: the public site URL (canonical links, citations, sitemap) and the
// API the browser calls directly (an https page cannot call an http API).
function checkProductionUrls() {
  const site = parseUrl("NEXT_PUBLIC_SITE_URL");
  if (site.missing) {
    fail("NEXT_PUBLIC_SITE_URL is not set.", "Set the site's public address, e.g. NEXT_PUBLIC_SITE_URL=https://hadith.vn");
  }
  if (!/^https?:$/.test(site.url.protocol) || site.local) {
    fail(`NEXT_PUBLIC_SITE_URL=${site.url.href} is not a public http(s) address.`, "Set the site's public address, e.g. https://hadith.vn");
  }
  if (site.url.pathname !== "/" || site.url.search || site.url.hash) {
    fail(`NEXT_PUBLIC_SITE_URL=${site.url.href} has a path; the site must be served at the root of its domain.`);
  }
  if (site.url.protocol !== "https:") {
    console.warn(`[hadith] warning: NEXT_PUBLIC_SITE_URL=${site.url.href} is not https.`);
  }

  const api = parseUrl("NEXT_PUBLIC_API_BASE_URL");
  if (api.missing) {
    fail("NEXT_PUBLIC_API_BASE_URL is not set.", "Set the public API address, e.g. NEXT_PUBLIC_API_BASE_URL=https://api.alquranarabia.com/api");
  }
  if (api.url.protocol !== "https:" || api.local) {
    fail(
      `NEXT_PUBLIC_API_BASE_URL=${api.url.href} is not a public https address.`,
      "The browser calls the API directly, so it must be public and https, e.g. https://api.alquranarabia.com/api"
    );
  }
}

// GOOGLE_ANALYTICS_ID goes into an inline script (pages/_document.js): an ID only.
function checkAnalyticsId() {
  const id = process.env.GOOGLE_ANALYTICS_ID;
  if (id && !/^[A-Za-z0-9-]+$/.test(id)) {
    fail(`GOOGLE_ANALYTICS_ID="${id}" is not a Google Analytics ID (e.g. G-XXXXXXXXXX).`);
  }
}

module.exports = (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    checkCountry({ required: true });
    checkAnalyticsId();
    if (process.env.ALLOW_LOCAL_BUILD === "1") {
      console.warn("[hadith] ALLOW_LOCAL_BUILD=1: the site and API URL checks are skipped. Do not deploy this build.");
    } else {
      checkProductionUrls();
    }
  } else if (phase === PHASE_DEVELOPMENT_SERVER) {
    checkCountry({ required: false });
    checkAnalyticsId();
  }

  return {
    reactStrictMode: true,
    poweredByHeader: false,
    // The analytics ID is read in the browser too (route-change page views),
    // so it is inlined at build time; empty means no analytics.
    env: {
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || "",
    },
    images: {
      // The site's images are small static files (logos), so next/image serves
      // them as they are. This also switches off the /_next/image optimizer,
      // whose known vulnerabilities (DoS, cache confusion, remote code execution
      // with crafted AVIF/SVG) have no fix in Next.js 13.
      unoptimized: true,
    },
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ],
        },
      ];
    },
  };
};
